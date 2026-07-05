const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47];
const GIF87 = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61];
const GIF89 = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];
const RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP = [0x57, 0x45, 0x42, 0x50];

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

export function detectImageMimeType(buffer: Buffer): string | null {
  const bytes = new Uint8Array(buffer);

  if (startsWith(bytes, JPEG)) return "image/jpeg";
  if (startsWith(bytes, PNG)) return "image/png";
  if (startsWith(bytes, GIF87) || startsWith(bytes, GIF89)) return "image/gif";
  if (
    startsWith(bytes, RIFF) &&
    bytes.length >= 12 &&
    startsWith(bytes.subarray(8, 12), WEBP)
  ) {
    return "image/webp";
  }

  return null;
}

export function validateImageBuffer(
  buffer: Buffer,
  declaredType: string,
): string | null {
  const detected = detectImageMimeType(buffer);
  if (!detected || detected !== declaredType) return null;
  return detected;
}
