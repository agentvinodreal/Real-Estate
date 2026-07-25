/** Deterministic dummy photography — same seed always resolves to the same image. */
export function dummyPhoto(seed: string, w = 800, h = 600): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
}

/** Deterministic dummy avatar for testimonials. */
export function dummyAvatar(seed: string): string {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(seed)}`
}
