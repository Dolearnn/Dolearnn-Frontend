export function isSafeMeetingLink(value?: string | null) {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
