// Resolves asset URLs. In the standalone offline build (VITE_OFFLINE=true) every
// asset is served from the locally bundled /offline-assets/ folder, so the app
// never touches the CDN. Online builds keep using the CDN pointers.

const OFFLINE = import.meta.env.VITE_OFFLINE === "true";

export function offlineAssetUrl(localName: string): string {
  return `${import.meta.env.BASE_URL}offline-assets/${localName}`;
}

/** Map a CDN asset pointer ({ url }) to a local file when running the offline build. */
export function assetUrl(pointer: { url: string }, localName: string): string {
  return OFFLINE ? offlineAssetUrl(localName) : pointer.url;
}

/** Resolve a raw CDN URL (e.g. from human-research.json) to a local file offline. */
export function assetUrlFromCdn(cdnUrl: string, localName: string): string {
  return OFFLINE ? offlineAssetUrl(localName) : cdnUrl;
}

export const isOfflineBuild = OFFLINE;
