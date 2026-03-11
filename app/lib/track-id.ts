export const TRACK_ID_ALIASES: Record<string, string> = {
  '3-bares-new-yamme-tee-bares-61d8703d': '8-bares-yamme-tee-bares-1be82f79',
  '6-dead-air-yamme-tee-dead-air-f5643b13': 'yamme-tee-dead-air-2d4e2052',
};

export function toCanonicalTrackId(trackId: string): string {
  const id = String(trackId || '').trim();
  return TRACK_ID_ALIASES[id] || id;
}
