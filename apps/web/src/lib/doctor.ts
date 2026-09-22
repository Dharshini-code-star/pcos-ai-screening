/**
 * Tamil Nadu healthcare navigation data.
 *
 * RULES THIS FILE FOLLOWS:
 *  - Nothing here is invented. Every facility is a long-established, publicly
 *    documented institution, and every URL below returned HTTP 200 with a
 *    valid TLS certificate when checked.
 *  - No phone numbers, addresses, doctor names, departments, or availability
 *    are asserted — only name, district, facility type, and an official link.
 *  - Private hospitals are labelled "Multispecialty" rather than claiming a
 *    PCOS/endocrine clinic that has not been verified.
 *  - Helpline numbers are the standard national/state public numbers.
 *  - Nothing here books anything.
 */

export type SupportType =
  | "gynaecology"
  | "endocrinology"
  | "nutrition"
  | "mental_health"
  | "government"
  | "emergency";

export const SUPPORT_TYPES: { value: SupportType; label: string }[] = [
  { value: "gynaecology", label: "Gynaecology / PCOS" },
  { value: "endocrinology", label: "Endocrinology" },
  { value: "nutrition", label: "Nutrition" },
  { value: "mental_health", label: "Mental health" },
  { value: "government", label: "Government hospital" },
  { value: "emergency", label: "Emergency" },
];

export type Sector = "government" | "private";

export interface Facility {
  name: string;
  district: string;
  /** Facility type (government) or service label (private). */
  type: string;
  sector: Sector;
  /** Official website or official directory entry. */
  url: string;
}

/** Official Tamil Nadu government sources (all verified reachable). */
export const OFFICIAL_SOURCES = {
  hospitalFinder: "https://www.nhm.tn.gov.in/en/for-find-hospital",
  healthDept: "https://tnhealth.tn.gov.in/",
  statePortal: "https://www.tn.gov.in/department/11",
};

/**
 * Government medical college hospitals. Corroborated public institutions.
 * Official source is the state hospital finder — individual facility sites
 * were either unreachable or had expired certificates, so they are not linked.
 */
export const GOVERNMENT_FACILITIES: Facility[] = [
  { name: "Madras Medical College", district: "Chennai", type: "Government Medical College", sector: "government", url: OFFICIAL_SOURCES.hospitalFinder },
  { name: "Stanley Medical College", district: "Chennai", type: "Government Medical College", sector: "government", url: OFFICIAL_SOURCES.hospitalFinder },
  { name: "Kilpauk Medical College", district: "Chennai", type: "Government Medical College", sector: "government", url: OFFICIAL_SOURCES.hospitalFinder },
  { name: "Chengalpattu Medical College", district: "Chengalpattu", type: "Government Medical College", sector: "government", url: OFFICIAL_SOURCES.hospitalFinder },
  { name: "Coimbatore Medical College", district: "Coimbatore", type: "Government Medical College", sector: "government", url: OFFICIAL_SOURCES.hospitalFinder },
  { name: "Madurai Medical College", district: "Madurai", type: "Government Medical College", sector: "government", url: OFFICIAL_SOURCES.hospitalFinder },
  { name: "Thanjavur Medical College", district: "Thanjavur", type: "Government Medical College", sector: "government", url: OFFICIAL_SOURCES.hospitalFinder },
  { name: "Tirunelveli Medical College", district: "Tirunelveli", type: "Government Medical College", sector: "government", url: OFFICIAL_SOURCES.hospitalFinder },
  { name: "Mohan Kumaramangalam Medical College", district: "Salem", type: "Government Medical College", sector: "government", url: OFFICIAL_SOURCES.hospitalFinder },
  { name: "Government Erode Medical College", district: "Erode", type: "Government Medical College", sector: "government", url: OFFICIAL_SOURCES.hospitalFinder },
];

/** Private hospitals. Official websites verified reachable. */
export const PRIVATE_FACILITIES: Facility[] = [
  { name: "Apollo Hospitals", district: "Chennai", type: "Multispecialty", sector: "private", url: "https://www.apollohospitals.com/" },
  { name: "MIOT International", district: "Chennai", type: "Multispecialty", sector: "private", url: "https://www.miotinternational.com/" },
  { name: "Sri Ramachandra Medical Centre", district: "Chennai", type: "Multispecialty", sector: "private", url: "https://www.sriramachandra.edu.in/" },
  { name: "Christian Medical College", district: "Vellore", type: "Multispecialty", sector: "private", url: "https://www.cmch-vellore.edu/" },
  { name: "PSG Hospitals", district: "Coimbatore", type: "Multispecialty", sector: "private", url: "https://www.psghospitals.com/" },
  { name: "Meenakshi Mission Hospital", district: "Madurai", type: "Multispecialty", sector: "private", url: "https://mmhrc.in/" },
  { name: "Kauvery Hospital", district: "Tiruchirappalli", type: "Multispecialty", sector: "private", url: "https://www.kauveryhospital.com/" },
];

export const ALL_FACILITIES: Facility[] = [...GOVERNMENT_FACILITIES, ...PRIVATE_FACILITIES];

export interface District {
  name: string;
  lat: number;
  lon: number;
}

/**
 * All 38 districts of Tamil Nadu — the single source of truth for the district
 * selector and for distance calculation. Maintained as one array: adding a row
 * here adds the district to the dropdown and to nearest-district detection.
 *
 * Coordinates are the administrative district centre as returned by
 * OpenStreetMap/Nominatim, resolved once at development time and baked in as
 * static data. They are NOT hospital coordinates, so any distance derived from
 * them is an approximate district-level distance and is labelled as such.
 * Being static, they also mean the browser never sends the user's position
 * anywhere to compute a distance.
 *
 * Most of these districts have no verified facility in ALL_FACILITIES. Choosing
 * one of them shows the empty state and the official state hospital finder —
 * never an invented result.
 */
export const TN_DISTRICTS: District[] = [
  { name: "Ariyalur", lat: 11.1531, lon: 79.2586 },
  { name: "Chengalpattu", lat: 12.6362, lon: 80.0654 },
  { name: "Chennai", lat: 13.0008, lon: 80.2023 },
  { name: "Coimbatore", lat: 10.8124, lon: 77.0796 },
  { name: "Cuddalore", lat: 11.5202, lon: 79.3396 },
  { name: "Dharmapuri", lat: 12.1456, lon: 78.1132 },
  { name: "Dindigul", lat: 10.4257, lon: 77.8155 },
  { name: "Erode", lat: 11.4905, lon: 77.3505 },
  { name: "Kallakurichi", lat: 11.7947, lon: 79.0388 },
  { name: "Kancheepuram", lat: 12.8796, lon: 79.7043 },
  { name: "Kanyakumari", lat: 8.25, lon: 77.25 },
  { name: "Karur", lat: 10.8218, lon: 78.3829 },
  { name: "Krishnagiri", lat: 12.5152, lon: 78.0094 },
  { name: "Madurai", lat: 9.9369, lon: 78.0078 },
  { name: "Mayiladuthurai", lat: 11.1896, lon: 79.6946 },
  { name: "Nagapattinam", lat: 10.6026, lon: 79.7619 },
  { name: "Namakkal", lat: 11.3034, lon: 78.1186 },
  { name: "Nilgiris", lat: 11.445, lon: 76.6975 },
  { name: "Perambalur", lat: 11.2903, lon: 78.93 },
  { name: "Pudukkottai", lat: 10.2903, lon: 78.8174 },
  { name: "Ramanathapuram", lat: 9.5206, lon: 78.5185 },
  { name: "Ranipet", lat: 12.9186, lon: 79.4082 },
  { name: "Salem", lat: 11.647, lon: 78.2107 },
  { name: "Sivaganga", lat: 9.8487, lon: 78.487 },
  { name: "Tenkasi", lat: 9.0934, lon: 77.4758 },
  { name: "Thanjavur", lat: 10.659, lon: 79.2014 },
  { name: "Theni", lat: 9.8693, lon: 77.4223 },
  { name: "Thoothukudi", lat: 8.8457, lon: 77.9938 },
  { name: "Tiruchirappalli", lat: 10.8505, lon: 78.7245 },
  { name: "Tirunelveli", lat: 8.5495, lon: 77.5805 },
  { name: "Tirupathur", lat: 12.453, lon: 78.5531 },
  { name: "Tiruppur", lat: 10.7915, lon: 77.5325 },
  { name: "Tiruvallur", lat: 13.1394, lon: 79.9071 },
  { name: "Tiruvannamalai", lat: 12.4289, lon: 78.9992 },
  { name: "Tiruvarur", lat: 10.6879, lon: 79.4979 },
  { name: "Vellore", lat: 12.9022, lon: 79.0611 },
  { name: "Viluppuram", lat: 12.1167, lon: 79.5989 },
  { name: "Virudhunagar", lat: 9.4926, lon: 77.8632 },
];

/** District names, alphabetical. Feeds the searchable district selector. */
export const DISTRICTS: string[] = TN_DISTRICTS.map((d) => d.name);

/** How many verified facilities this dataset holds per district. */
export const FACILITY_COUNT_BY_DISTRICT: Record<string, number> = ALL_FACILITIES.reduce<
  Record<string, number>
>((acc, f) => {
  acc[f.district] = (acc[f.district] ?? 0) + 1;
  return acc;
}, {});

export interface Helpline {
  number: string;
  label: string;
}

/** Standard public helpline numbers. */
export const HELPLINES: Helpline[] = [
  { number: "108", label: "Emergency ambulance" },
  { number: "104", label: "Health helpline" },
  { number: "102", label: "Maternity & child ambulance" },
  { number: "112", label: "Emergency" },
];

/**
 * Which support types a facility can be surfaced for.
 * Multispecialty and medical college hospitals cover clinical specialties
 * broadly; the department itself must be confirmed with the provider.
 */
export function matchesSupport(f: Facility, support: SupportType | "all"): boolean {
  if (support === "all") return true;
  if (support === "emergency") return true;
  if (support === "government") return f.sector === "government";
  return true;
}

export const DISCLAIMER =
  "Healthcare information is for navigation only. Verify services and availability with the provider.";

export const SCREENING_NOTE = "PCOSense is a screening and awareness tool, not a diagnosis.";

/**
 * District centre coordinates, keyed by district name. Derived from
 * TN_DISTRICTS so the two can never drift apart.
 */
export const DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = Object.fromEntries(
  TN_DISTRICTS.map((d) => [d.name, { lat: d.lat, lon: d.lon }])
);

/** Great-circle distance in km. Runs entirely in the browser. */
export function distanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Nearest known district to a position — used to show an area, never coordinates. */
export function nearestDistrict(pos: { lat: number; lon: number }): {
  district: string;
  km: number;
} | null {
  let best: { district: string; km: number } | null = null;
  for (const [district, c] of Object.entries(DISTRICT_COORDS)) {
    const km = distanceKm(pos, c);
    if (!best || km < best.km) best = { district, km };
  }
  return best;
}

export const LOCATION_PRIVACY_NOTE =
  "Your location is used only to find nearby healthcare support.";

export const LOCATION_DENIED = "Location unavailable. Select your district instead.";

export const DISTANCE_NOTE = "Distances are approximate, to the district centre.";

export const DEPARTMENT_NOTE = "Departments vary — confirm with the provider.";
