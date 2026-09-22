"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown, ExternalLink, Loader2, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_FACILITIES,
  DEPARTMENT_NOTE,
  DISTANCE_NOTE,
  DISTRICT_COORDS,
  DISTRICTS,
  FACILITY_COUNT_BY_DISTRICT,
  HELPLINES,
  LOCATION_DENIED,
  LOCATION_PRIVACY_NOTE,
  distanceKm,
  matchesSupport,
  nearestDistrict,
  OFFICIAL_SOURCES,
  SUPPORT_TYPES,
  type Facility,
  type Sector,
  type SupportType,
} from "@/lib/doctor";

type SectorFilter = "all" | Sector;
type LocState = "idle" | "asking" | "granted" | "denied";

const ALL_DISTRICTS_LABEL = "All districts";

/**
 * Geolocation policy:
 *  - permission is requested only on an explicit click,
 *  - coordinates live in a local variable for the lifetime of this component,
 *  - they are never stored, never logged, and never sent to any server —
 *    distance is computed in the browser against static district coordinates,
 *  - the UI shows the detected DISTRICT, never the raw latitude/longitude.
 */
export function DoctorFinder() {
  const [district, setDistrict] = useState<string>("all");
  const [support, setSupport] = useState<SupportType | "all">("all");
  const [sector, setSector] = useState<SectorFilter>("all");

  const [locState, setLocState] = useState<LocState>("idle");
  const [pos, setPos] = useState<{ lat: number; lon: number } | null>(null);
  const [area, setArea] = useState<string | null>(null);

  function findNearMe() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocState("denied");
      return;
    }
    setLocState("asking");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lon: p.coords.longitude };
        setPos(here);
        const detected = nearestDistrict(here)?.district ?? null;
        setArea(detected);
        setLocState("granted");
        // Preselect the detected district only when something is actually
        // listed there; otherwise stay on "All districts" so the nearest-first
        // sort still has results to show.
        setDistrict(detected && FACILITY_COUNT_BY_DISTRICT[detected] ? detected : "all");
      },
      () => setLocState("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  const results = useMemo(() => {
    const list = ALL_FACILITIES.filter(
      (f) =>
        (district === "all" || f.district === district) &&
        (sector === "all" || f.sector === sector) &&
        matchesSupport(f, support)
    ).map((f) => {
      const c = DISTRICT_COORDS[f.district];
      const km = pos && c ? distanceKm(pos, c) : null;
      return { f, km };
    });

    if (pos) {
      list.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
    } else {
      // Government first when no location, so public options lead.
      list.sort((a, b) => (a.f.sector === b.f.sector ? 0 : a.f.sector === "government" ? -1 : 1));
    }
    return list;
  }, [district, sector, support, pos]);

  const clinicalFilter =
    support === "gynaecology" ||
    support === "endocrinology" ||
    support === "nutrition" ||
    support === "mental_health";

  const emptyArea = locState === "granted" && area !== null && !FACILITY_COUNT_BY_DISTRICT[area];

  return (
    <div className="space-y-5">
      {/* Location + filters */}
      <section className="rounded-2xl border border-brand-pink-300/70 bg-brand-blush-50 p-3 sm:p-4">
        <h2 className="text-sm font-semibold">Location</h2>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Button
            size="sm"
            className="rounded-full"
            onClick={findNearMe}
            disabled={locState === "asking"}
          >
            {locState === "asking" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <MapPin className="size-3.5" />
            )}
            Find healthcare near me
          </Button>
          {locState === "granted" && area && (
            <span className="text-xs font-medium text-brand-mauve-700">Near {area}</span>
          )}
          {locState === "denied" && (
            <span className="text-xs text-muted-foreground">{LOCATION_DENIED}</span>
          )}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="district" className="text-xs text-muted-foreground">
              District
            </Label>
            <DistrictCombobox value={district} onChange={setDistrict} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="support" className="text-xs text-muted-foreground">
              Support needed
            </Label>
            <Select value={support} onValueChange={(v) => setSupport(v as SupportType | "all")}>
              <SelectTrigger id="support" className="w-full rounded-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All support</SelectItem>
                {SUPPORT_TYPES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="mt-2.5 text-[11px] leading-snug text-muted-foreground">
          {LOCATION_PRIVACY_NOTE}
          {emptyArea && <> No verified facility is listed in {area}; showing the nearest instead.</>}
          {clinicalFilter && <> {DEPARTMENT_NOTE}</>}
        </p>
      </section>

      {/* Helplines */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Helplines</h2>
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-brand-pink-300/70 bg-brand-blush-50 p-3 sm:grid-cols-4">
          {HELPLINES.map((h) => (
            <a
              key={h.number}
              href={`tel:${h.number}`}
              className="rounded-xl bg-background/70 p-2.5 text-center hover:bg-background"
            >
              <span className="flex items-center justify-center gap-1 text-lg font-semibold text-brand-mauve-700">
                <Phone className="size-3.5" />
                {h.number}
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground">{h.label}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Sector filter */}
      <section className="flex flex-wrap items-center gap-1.5">
        <h2 className="mr-1 text-sm font-semibold">Show</h2>
        {(
          [
            ["all", "All"],
            ["government", "Government"],
            ["private", "Private"],
          ] as [SectorFilter, string][]
        ).map(([v, label]) => (
          <Button
            key={v}
            size="sm"
            variant={sector === v ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setSector(v)}
          >
            {label}
          </Button>
        ))}
      </section>

      {/* Results */}
      {results.length === 0 ? (
        <section className="rounded-2xl border border-border/70 bg-muted/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No verified resources found for this location.
          </p>
          <a
            href={OFFICIAL_SOURCES.hospitalFinder}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Search the official Tamil Nadu hospital finder
            <ExternalLink className="size-3" />
          </a>
        </section>
      ) : (
        <section className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold">
              {pos ? "Nearest first" : "Healthcare facilities"}
            </h2>
            {pos && <span className="text-[11px] text-muted-foreground">{DISTANCE_NOTE}</span>}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {results.map(({ f, km }) => (
              <FacilityCard key={f.name} f={f} km={km} />
            ))}
          </div>
          <a
            href={OFFICIAL_SOURCES.hospitalFinder}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Find DHQ, Taluk &amp; PHC by district
            <ExternalLink className="size-3" />
          </a>
        </section>
      )}
    </div>
  );
}

/**
 * Searchable single-select over all 38 Tamil Nadu districts. The list is long,
 * so it stays behind a dropdown with a type-to-filter field rather than being
 * rendered as a wall of buttons. The trailing number is how many verified
 * facilities this dataset actually holds for that district.
 */
function DistrictCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  function select(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id="district"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between rounded-full bg-background font-normal"
        >
          <span className="truncate">{value === "all" ? ALL_DISTRICTS_LABEL : value}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Search district" />
          <CommandList>
            <CommandEmpty>No district found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={ALL_DISTRICTS_LABEL}
                data-checked={value === "all"}
                onSelect={() => select("all")}
              >
                {ALL_DISTRICTS_LABEL}
              </CommandItem>
              {DISTRICTS.map((d) => (
                <CommandItem
                  key={d}
                  value={d}
                  data-checked={value === d}
                  onSelect={() => select(d)}
                >
                  {d}
                  {FACILITY_COUNT_BY_DISTRICT[d] ? (
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {FACILITY_COUNT_BY_DISTRICT[d]}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function FacilityCard({ f, km }: { f: Facility; km: number | null }) {
  return (
    <div className="card-lift rounded-xl border border-border/70 p-3">
      <p className="text-sm font-medium leading-snug">{f.name}</p>
      <p className="text-xs text-muted-foreground">
        {f.district}
        {km !== null && <> · ~{Math.round(km)} km</>}
      </p>
      <p className="text-xs text-muted-foreground">{f.type}</p>
      <a
        href={f.url}
        target="_blank"
        rel="noreferrer"
        className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        {f.sector === "government" ? "Official source" : "Visit website"}
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
}
