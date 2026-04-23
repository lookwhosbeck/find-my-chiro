const MAX_LEN = 2048;

export type WelcomeVideoUrlParseResult =
  | { ok: true; url: string | null }
  | { ok: false; message: string };

/**
 * Normalize dashboard input: empty → null; otherwise trim and validate as http(s) URL.
 */
export function parseWelcomeVideoUrlInput(raw: string): WelcomeVideoUrlParseResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true as const, url: null };

  if (trimmed.length > MAX_LEN) {
    return { ok: false as const, message: `Use a link of ${MAX_LEN} characters or fewer.` };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      ok: false as const,
      message: 'Paste a full link starting with https:// (open your video on YouTube or Vimeo and copy the address bar or Share link).',
    };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false as const, message: 'Only web links (http or https) are supported.' };
  }

  return { ok: true as const, url: trimmed };
}
