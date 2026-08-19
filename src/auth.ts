const encoder = new TextEncoder();

function timingSafeEqual(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  const length = Math.max(left.byteLength, right.byteLength);
  const leftPadded = new Uint8Array(length);
  const rightPadded = new Uint8Array(length);
  leftPadded.set(left);
  rightPadded.set(right);

  let mismatch = left.byteLength === right.byteLength ? 0 : 1;
  for (let i = 0; i < length; i += 1) {
    mismatch |= leftPadded[i] ^ rightPadded[i];
  }
  return mismatch === 0;
}

export function isAuthorized(request: Request, token: string | undefined): boolean {
  if (!token) return false;

  const header = request.headers.get("authorization");
  if (!header) return false;

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match?.[1]) return false;

  return timingSafeEqual(match[1], token);
}
