import "server-only";
import type { AssessRequest, AssessResponse, ModelInfoResponse } from "@/lib/ml/types";

function baseUrl() {
  const url = process.env.ML_SERVICE_URL;
  if (!url) throw new Error("ML_SERVICE_URL is not set");
  return url;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ML service ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

export function assess(payload: AssessRequest): Promise<AssessResponse> {
  return post<AssessResponse>("/assess", payload);
}

export function whatIf(payload: AssessRequest): Promise<AssessResponse> {
  return post<AssessResponse>("/whatif", payload);
}

export async function modelInfo(): Promise<ModelInfoResponse> {
  const res = await fetch(`${baseUrl()}/model-info`, { cache: "no-store" });
  if (!res.ok) throw new Error(`ML service /model-info failed (${res.status})`);
  return res.json() as Promise<ModelInfoResponse>;
}
