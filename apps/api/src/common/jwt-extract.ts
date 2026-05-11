/**
 * Simple JWT payload extractor — decodes without verifying (signature is verified by JwtService).
 * Used by controllers that need farmerId from the Authorization header.
 */
export function extractFarmerIdFromHeader(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const payloadB64 = token.split('.')[1];
    if (!payloadB64) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as Record<string, unknown>;
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
