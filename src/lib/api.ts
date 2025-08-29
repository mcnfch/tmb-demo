import { headers } from "next/headers";

async function absoluteUrl(path: string) {
  if (/^https?:/i.test(path)) return path;
  const h = await headers();
  const host =
    h.get("x-forwarded-host") ??
    h.get("host") ??
    process.env.NEXT_PUBLIC_SITE_HOST ??
    "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "development" ? "http" : "https");
  const base = `${proto}://${host}`;
  return path.startsWith("/") ? base + path : `${base}/${path}`;
}

export async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = await absoluteUrl(path);
  const res = await fetch(url, { ...init, cache: init?.cache ?? "no-store" });
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json();
}
