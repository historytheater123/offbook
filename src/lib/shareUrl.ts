import LZString from 'lz-string';

export function encodeScript(rawText: string): string {
  const compressed = LZString.compressToEncodedURIComponent(rawText);
  return `${window.location.origin}${window.location.pathname}#script=${compressed}`;
}

export function decodeScriptFromUrl(): string | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#script=')) return null;
  try {
    const encoded = hash.slice(8);
    return LZString.decompressFromEncodedURIComponent(encoded);
  } catch {
    return null;
  }
}

export async function copyShareUrl(rawText: string): Promise<boolean> {
  try {
    const url = encodeScript(rawText);
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
