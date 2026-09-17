import { NextResponse, type NextRequest } from "next/server";

/**
 * Primera barrera para la web administrativa (/admin y /internal/v1).
 *
 * Corre en edge, así que no puede consultar Prisma: sólo verifica que exista la
 * cookie de sesión de NextAuth y, si no, responde 307 a /internal antes de que
 * Next empiece a renderizar (y a consultar datos) en paralelo. La verificación
 * de que la sesión pertenece a un InternalUser la hace `requireStaff()` en cada
 * layout/página y `internalProcedure` en la API.
 */
const SESSION_COOKIES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

export function middleware(req: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/internal";
  url.search = "";
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: ["/admin/:path*", "/internal/v1/:path*"],
};
