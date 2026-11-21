import { NextRequest, NextResponse } from 'next/server';

const allowedMethods = 'GET, POST, OPTIONS';
const allowedHeaders = 'Authorization, Content-Type';
const protectedHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

function getAllowedOrigins(): string[] | null {
  const configured = process.env.WMS_ALLOWED_ORIGINS?.trim();
  if (!configured) {
    return [];
  }

  const origins = configured.split(',').map((value) => value.trim());
  if (
    origins.some((origin) => {
      try {
        const parsed = new URL(origin);
        return (
          parsed.origin !== origin ||
          !['http:', 'https:'].includes(parsed.protocol) ||
          parsed.username !== '' ||
          parsed.password !== ''
        );
      } catch {
        return true;
      }
    })
  ) {
    return null;
  }

  return origins;
}

function addProtectedHeaders(response: NextResponse): NextResponse {
  for (const [name, value] of Object.entries(protectedHeaders)) {
    response.headers.set(name, value);
  }
  return response;
}

function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  }
  response.headers.set('Access-Control-Allow-Methods', allowedMethods);
  response.headers.set('Access-Control-Allow-Headers', allowedHeaders);
  response.headers.set('Access-Control-Max-Age', '600');
  return response;
}

function configurationError(): NextResponse {
  return addProtectedHeaders(
    NextResponse.json({ error: 'WMS authentication or origin configuration is invalid.' }, { status: 503 })
  );
}

function unauthorized(): NextResponse {
  const response = NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  response.headers.set('WWW-Authenticate', 'Basic realm="WMS", charset="UTF-8"');
  return addProtectedHeaders(response);
}

async function constantTimeEqual(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(left)),
    crypto.subtle.digest('SHA-256', encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;
  for (let i = 0; i < leftBytes.length; i += 1) {
    difference |= leftBytes[i] ^ rightBytes[i];
  }
  return difference === 0;
}

async function hasValidCredentials(request: NextRequest, username: string, password: string): Promise<boolean> {
  const authorization = request.headers.get('authorization') || '';
  const match = /^Basic ([A-Za-z0-9+/]+={0,2})$/.exec(authorization);
  if (!match) {
    return false;
  }

  try {
    const binary = atob(match[1]);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    const separator = decoded.indexOf(':');
    if (separator < 0) {
      return false;
    }

    const suppliedUsername = decoded.slice(0, separator);
    const suppliedPassword = decoded.slice(separator + 1);
    const [usernameMatches, passwordMatches] = await Promise.all([
      constantTimeEqual(suppliedUsername, username),
      constantTimeEqual(suppliedPassword, password),
    ]);
    return usernameMatches && passwordMatches;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const isApiRequest = request.nextUrl.pathname.startsWith('/api/');
  const allowedOrigins = getAllowedOrigins();
  if (!allowedOrigins) {
    return configurationError();
  }

  const origin = request.headers.get('origin');
  const sameOrigin = origin === request.nextUrl.origin;
  const corsAllowed = Boolean(origin && (sameOrigin || allowedOrigins.includes(origin)));

  if (isApiRequest && origin && !corsAllowed) {
    return addProtectedHeaders(NextResponse.json({ error: 'Origin is not allowed.' }, { status: 403 }));
  }

  if (isApiRequest && request.method === 'OPTIONS') {
    const requestedMethod = request.headers.get('access-control-request-method')?.toUpperCase();
    const requestedHeaders = (request.headers.get('access-control-request-headers') || '')
      .split(',')
      .map((header) => header.trim().toLowerCase())
      .filter(Boolean);

    if (
      (requestedMethod && !allowedMethods.split(', ').includes(requestedMethod)) ||
      requestedHeaders.some((header) => !['authorization', 'content-type'].includes(header))
    ) {
      return addProtectedHeaders(NextResponse.json({ error: 'Requested CORS operation is not allowed.' }, { status: 403 }));
    }

    return addProtectedHeaders(addCorsHeaders(new NextResponse(null, { status: 204 }), corsAllowed ? origin : null));
  }

  const username = process.env.WMS_AUTH_USER;
  const password = process.env.WMS_AUTH_PASSWORD;
  const authConfigured = Boolean(username || password);
  const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const authRequired = process.env.NODE_ENV === 'production' || databaseConfigured || authConfigured;

  if (authRequired) {
    if (!username || username.includes(':') || !password || password.length < 16) {
      return configurationError();
    }
    if (!(await hasValidCredentials(request, username, password))) {
      return unauthorized();
    }
  }

  const response = addProtectedHeaders(NextResponse.next());
  if (isApiRequest && corsAllowed) {
    addCorsHeaders(response, origin);
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
