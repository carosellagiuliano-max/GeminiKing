const HEADER_CANDIDATES = [
  'x-nf-client-connection-ip',
  'x-real-ip',
  'x-client-ip',
  'cf-connecting-ip',
  'fastly-client-ip',
  'x-forwarded-for',
];

function normalizeIp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('::ffff:')) {
    return trimmed.slice(7);
  }

  return trimmed;
}

export function extractClientIp(source: Request | Headers | { headers: Headers } | null | undefined, fallback = 'anonymous') {
  if (!source) {
    return fallback;
  }

  let headers: Headers | null = null;

  if (source instanceof Headers) {
    headers = source;
  } else if (source instanceof Request) {
    headers = source.headers;
  } else if ('headers' in (source as { headers?: unknown })) {
    const maybeHeaders = (source as { headers?: unknown }).headers;
    if (maybeHeaders instanceof Headers) {
      headers = maybeHeaders;
    }
  }

  if (!headers) {
    return fallback;
  }

  for (const header of HEADER_CANDIDATES) {
    const rawValue = headers.get(header);
    if (!rawValue) {
      continue;
    }

    const candidate = header === 'x-forwarded-for' ? rawValue.split(',')[0] : rawValue;
    const normalized = normalizeIp(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return fallback;
}
