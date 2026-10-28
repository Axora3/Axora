"use client";

/**
 * PUT a file to a Supabase signed upload URL with real progress events
 * (supabase-js has no progress callback). Same wire format as storage-js.
 */
export function uploadWithProgress(bucket: string, path: string, token: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return new Promise((resolve, reject) => {
    if (!base) return reject(new Error("not configured"));
    const url = `${base}/storage/v1/object/upload/sign/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}?token=${encodeURIComponent(token)}`;
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(body);
  });
}

export function publicPreviewUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/template-previews/${path}`;
}
