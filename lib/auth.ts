import jwt from 'jsonwebtoken';
import { parse as parseCookie, serialize as serializeCookie } from 'cookie';

export type Session = { role: 'admin' | 'family'; family_id?: string; username: string };

const COOKIE_NAME = 'afaespiga_session';

export function signSession(session: Session) {
  const secret = process.env.APP_JWT_SECRET!;
  return jwt.sign(session, secret, { expiresIn: '14d' });
}

export function verifySession(token: string): Session | null {
  try {
    const secret = process.env.APP_JWT_SECRET!;
    return jwt.verify(token, secret) as Session;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: Request): Session | null {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = parseCookie(cookieHeader);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifySession(token);
}

export function setSessionCookie(token: string) {
  return serializeCookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 14
  });
}

export function clearSessionCookie() {
  return serializeCookie(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 0
  });
}
