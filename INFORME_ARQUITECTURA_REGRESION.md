# Informe de Arquitectura y Diagnóstico de Regresión — Forevent

**Fecha:** 12 de marzo de 2026  
**Alcance:** Análisis exhaustivo para identificar estructura, flujo de datos y posibles causas de regresión.

---

## 1. Stack Tecnológico

| Tecnología | Versión | Ubicación |
|------------|---------|-----------|
| **Node.js** | ≥18.18.0 | `package.json` (engines) |
| **pnpm** | 8.9.0 | packageManager |
| **TypeScript** | ^5.3.3 | Raíz, api, db, nextjs, expo |
| **React** | 18.2.0 | Web y Mobile |
| **Next.js** | ^14.1.0 | apps/nextjs |
| **Expo** | ~50.0.17 | apps/expo |
| **React Native** | 0.73.6 | apps/expo |
| **tRPC** | 11.0.0-next-beta.264 | api, nextjs, expo |
| **NextAuth** | 5.0.0-beta.5 | packages/auth |
| **Prisma** | ^5.9.1 | packages/db |
| **Supabase** | @supabase/supabase-js ^2.97.0 | apps/nextjs (Storage únicamente) |
| **TanStack React Query** | 5.18.0 | nextjs, expo, api |
| **Turbo** | ^1.10.12 | Monorepo |

**Notas:**
- **Supabase** se usa solo para Storage (imágenes), no para Auth.
- **Tango Gestión:** No hay referencias en el repositorio.
- **Base de datos:** PostgreSQL (Supabase) vía Prisma.

---

## 2. Arquitectura de Directorios

```
ForeventKonTechDev2025nicoonline/
├── apps/
│   ├── auth-proxy/          # Proxy OAuth (H3 + Discord) para callbacks
│   ├── expo/                # App móvil React Native (Expo SDK 50)
│   └── nextjs/              # Dashboard, admin, web pública
├── packages/
│   ├── api/                  # tRPC routers (web + mobile)
│   ├── auth/                 # NextAuth (Google + Credentials)
│   ├── db/                   # Prisma schema + client
│   ├── ui/                   # Componentes compartidos + templates email
│   └── validators/           # Schemas Zod
├── tooling/
│   ├── eslint/
│   ├── github/
│   ├── prettier/
│   ├── tailwind/
│   └── typescript/
└── turbo.json
```

### Responsabilidades principales

| Carpeta | Responsabilidad |
|---------|-----------------|
| **apps/nextjs** | Dashboard administrativo, eventos, ventas, login web, uploads, mapa web (Google Maps JS) |
| **apps/expo** | App móvil: eventos, tickets, mapa (react-native-maps), QR, gift, live |
| **apps/auth-proxy** | Proxy de OAuth para Discord (preview environments) |
| **packages/api** | tRPC: routers `web` y `mobile`, context con Prisma + session |
| **packages/auth** | NextAuth 5: Google, Credentials (interno + externo), JWT |
| **packages/db** | Prisma + PostgreSQL (Supabase) |
| **packages/ui** | Componentes Radix, templates Resend, form logic |

---

## 3. Flujo de Datos Crítico

### 3.1 Web (Next.js)

```
[Browser] → Next.js App Router
         → tRPC Client (unstable_httpBatchStreamLink)
         → /api/trpc (auth middleware)
         → createTRPCContext({ session: req.auth })
         → appRouter (webRouter)
         → Prisma
```

- **Session:** NextAuth JWT en cookie → `req.auth`
- **tRPC:** Mismo origen → cookies incluidas automáticamente

### 3.2 Mobile (Expo)

```
[Expo App] → TRPCProvider (httpBatchLink)
          → fetch(https://www.foreventapp.com/api/trpc)
          → headers: { "x-trpc-source": "expo-react" }
          → auth() → req.auth (cookies no enviadas cross-origin)
          → createTRPCContext({ session: opts.session ?? auth() })
          → appRouter (mobileRouter)
          → Prisma
```

- **Login móvil:** `mobile.auth.login` / `validateSession` (public) → devuelve `{ user, sessionId }`
- **Persistencia:** AsyncStorage (`session`, `user`) vía `useStorageState`
- **Validación al arranque:** `validateSession.mutate({ sessionId })` en `apps/expo/src/app/index.tsx`

### 3.3 Supabase

- **Uso:** Storage para imágenes (eventos, productos, deals, guilds)
- **Cliente:** `supabaseAdmin` en `apps/nextjs/src/lib/supabase.ts`
- **Variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### 3.4 Base de datos (Prisma)

- **PostgreSQL** en Supabase (Pooler 5432)
- **Variables:** `DATABASE_URL`, `DIRECT_URL`
- **Modelos:** User, Session, Event, Location, Ticket, Guild, etc.

---

## 4. Estado Global y Autenticación

### 4.1 Estado

| Herramienta | Uso |
|-------------|-----|
| **React Context** | Auth (`SessionProvider`), Form (Radix), Carousel |
| **TanStack React Query** | Caché y fetching tRPC (web + mobile) |
| **useStorageState** | Session en Expo (AsyncStorage) |
| **sharedQueryClient** | Limpieza de caché en signOut (Expo) |

No se usa Redux ni Zustand.

### 4.2 Autenticación Web

- NextAuth 5 con estrategia JWT
- Providers: Google OAuth, Credentials (interno `internalUser`, externo `User`)
- Session persistida en cookie

### 4.3 Autenticación Mobile

- **AuthChallenge:** código para login sin contraseña
- **Session Prisma:** `Session` con `userId`; mobile guarda `session.id` en AsyncStorage
- **validateSession:** comprueba `Session` en DB y expiración

### 4.4 Punto crítico: procedimientos protegidos desde mobile

El cliente tRPC de Expo **no envía** `sessionId` ni token en headers:

```ts
headers() {
  const headers = new Map<string, string>();
  headers.set("x-trpc-source", "expo-react");
  return Object.fromEntries(headers);
}
```

El handler usa `auth()` de NextAuth, que depende de cookies. En requests cross-origin desde mobile, no hay cookies, por lo que `req.auth` suele ser `null`.  
Si `ctx.session` es `null` en `protectedProcedure`, se lanzará `UNAUTHORIZED`.

Posibles explicaciones:

- Hay lógica adicional en NextAuth para leer sesión desde otros canales (por verificar).
- La mayoría de flujos móviles usan procedimientos públicos.
- Existe integración de sesión no documentada en el código analizado.

---

## 5. Puntos de Falla Potenciales

Considerando cambios recientes (MapView, `app.config.ts`, Expo plugins, Gradle):

### 5.1 Config Plugin mal configurado

**Archivo:** `apps/expo/expo-plugins/with-modify-gradle.js`

- Inyecta `implementation project(':react-native-background-timer')` en `build.gradle`.
- `withProjectBuildGradle` modifica el root `build.gradle`, donde el primer `dependencies {` está dentro de `buildscript`.
- El reemplazo inserta `implementation` en un bloque donde solo es válido `classpath()`.
- `react-native-background-timer` ya está autolinkeado; la inyección es innecesaria y da lugar a errores de Gradle.

### 5.2 Mapa de previsualización en mobile

**Archivo:** `apps/expo/src/app/(app)/home/event/[eventId]/index.tsx`

- MapView con `provider={PROVIDER_GOOGLE}` y `initialRegion`.
- Coordenadas con fallback a Yerba Buena si `location` falta.
- Condición: `event.location && hasValidCoords` → si `event.location` es null, no se renderiza el mapa.
- Estilos: `mapCard` con `height: 300` configurado.

Posibles causas de mapa gris:

- API key nativa: `android.config.googleMaps.apiKey` en `app.config.ts` y en `AndroidManifest.xml`.
- Uso en Expo Go en lugar de development build.
- Restricciones de API key en Google Cloud.

### 5.3 Entorno Java / Gradle

**Archivo:** `apps/expo/android/gradle.properties`

- `org.gradle.java.home` apuntando a Android Studio JBR (posible Java 21).
- Gradle 8.3 pensado para Java 17; Java 21 puede provocar errores con jlink.

### 5.4 Diferencias de estructura entre web y mobile

- Web: `event.location` con `latitude`, `longitude` desde la API.
- Mobile: `api.mobile.event.byId` incluye `location: true` con la misma estructura.
- Ambos usan el mismo modelo Prisma; el problema no parece estar en el schema.

### 5.5 Archivos sensibles a regresión

| Archivo | Riesgo |
|---------|--------|
| `packages/api/src/trpc.ts` | Cambios en `createTRPCContext` afectan a web y mobile |
| `packages/auth/src/index.ts` | Cambios en `authorize` o callbacks pueden romper login |
| `apps/expo/src/utils/api.tsx` | Cambios en `getBaseUrl` o headers afectan conectividad |
| `apps/expo/expo-plugins/with-modify-gradle.js` | Inyección Gradle incorrecta |
| `apps/expo/expo-plugins/with-gesture-handler.js` | Autolinking manual para monorepo pnpm |

---

## 6. Dependencias Críticas

### 6.1 Overrides en raíz

```json
"expo-modules-autolinking": "1.10.3",
"expo-font": "11.10.3",
"expo-constants": "~15.4.5",
"expo-linking": "~6.2.2",
"react-native-gesture-handler": "~2.14.0"
```

### 6.2 Patches

- `react-native-gesture-handler@2.14.1`: patch para compatibilidad con monorepo.

### 6.3 Versiones compartidas web / mobile

| Paquete | Web | Mobile |
|---------|-----|--------|
| @trpc/client | 11.0.0-next-beta.264 | 11.0.0-next-beta.264 |
| @tanstack/react-query | 5.18.0 | 5.18.0 |
| react | 18.2.0 | 18.2.0 |
| superjson | 2.2.1 | 2.2.1 |
| zod | ^3.22.4 | ^3.22.4 |

### 6.4 Posibles conflictos

- **NextAuth 5.0.0-beta.5**: versión beta; cambios en tipos o API pueden provocar regresiones.
- **@trpc 11.0.0-next-beta.264**: beta; posibles desajustes con el cliente de React.
- **expo 50 vs react-native 0.73**: combo soportado, pero sensible a desactualizaciones.
- **@supabase/supabase-js 2.97.0**: versión reciente; revisar compatibilidad con Storage.

### 6.5 Librerías específicas de mobile

- `react-native-maps`: 1.10.0 (requiere API key nativa en Android).
- `react-native-background-timer`: ^2.4.1 (autolinkeado; no requiere inyección en Gradle).
- `react-native-gesture-handler`: incluido manualmente por autolinking en monorepo pnpm.

---

## 7. Resumen para Diagnóstico

### Hallazgos principales

1. **Config Plugin:** `with-modify-gradle.js` inyecta `implementation project(':react-native-background-timer')` en el bloque incorrecto de Gradle, provocando errores de compilación.
2. **Autenticación mobile:** El cliente tRPC no envía session/token en headers; hay que confirmar cómo se mantiene sesión en procedimientos protegidos.
3. **Mapa mobile:** Configuración correcta en código; posible problema por API key nativa, uso de Expo Go o restricciones en Google Cloud.
4. **Java / Gradle:** Java 21 con Gradle 8.3 puede generar errores de jlink; conviene Java 17 o Gradle 8.5+.

### Acciones recomendadas (orden sugerido)

1. Eliminar la inyección de `react-native-background-timer` en `with-modify-gradle.js`.
2. Revisar y documentar el flujo de sesión para procedimientos protegidos desde mobile.
3. Usar `expo run:android` (development build) para probar el mapa, no Expo Go.
4. Ajustar entorno a Java 17 o actualizar Gradle si se mantiene Java 21.
5. Ejecutar `expo prebuild --clean` tras corregir plugins.
6. Revisar restricciones de la API key de Google Maps para Android.

### Archivos clave para depurar

- `apps/expo/expo-plugins/with-modify-gradle.js` — Gradle
- `apps/expo/app.config.ts` — API key y plugins
- `apps/expo/src/utils/api.tsx` — tRPC y headers
- `packages/api/src/trpc.ts` — contexto y sesión
- `apps/nextjs/src/app/api/trpc/[trpc]/route.ts` — handler tRPC
