import { OAuth2Client } from "google-auth-library";

/**
 * Cliente de Google OAuth — instancia singleton para reusar conexiones HTTP
 * y caché de claves públicas de Google al verificar ID tokens.
 */
const client = new OAuth2Client();

export interface GoogleProfile {
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
  /** ID estable de Google para este usuario (subject del JWT). */
  googleId: string;
}

/**
 * Verifica un ID token recibido del cliente mobile contra los servicios de Google.
 * Valida:
 *   · Firma criptográfica del token contra las claves públicas de Google.
 *   · Audience (`aud` claim) — debe ser uno de los OAuth Client IDs registrados
 *     para nuestra app. Esto evita que tokens de OTRA app sean aceptados.
 *   · Expiración del token.
 *
 * @throws Error si el token es inválido, expiró, o no fue emitido para nuestros clients.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const audiences: string[] = [];

  // Web client ID — preferimos GOOGLE_OAUTH_WEB_CLIENT_ID si existe, si no caemos
  // al GOOGLE_CLIENT_ID que ya usa NextAuth en el web (es la misma OAuth client app).
  const webClientId =
    process.env.GOOGLE_OAUTH_WEB_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
  if (webClientId) audiences.push(webClientId);

  // Client IDs específicos por plataforma (opcionales — solo si los configurás).
  if (process.env.GOOGLE_OAUTH_IOS_CLIENT_ID)
    audiences.push(process.env.GOOGLE_OAUTH_IOS_CLIENT_ID);
  if (process.env.GOOGLE_OAUTH_ANDROID_CLIENT_ID)
    audiences.push(process.env.GOOGLE_OAUTH_ANDROID_CLIENT_ID);

  if (audiences.length === 0) {
    throw new Error(
      "[google-auth] No hay OAuth Client IDs configurados. Definí GOOGLE_CLIENT_ID o GOOGLE_OAUTH_WEB_CLIENT_ID en el .env del backend.",
    );
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: audiences,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error("[google-auth] Token sin payload");
  }
  if (!payload.email) {
    throw new Error("[google-auth] Token sin email");
  }
  if (!payload.sub) {
    throw new Error("[google-auth] Token sin subject");
  }

  return {
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: payload.name ?? null,
    picture: payload.picture ?? null,
    googleId: payload.sub,
  };
}
