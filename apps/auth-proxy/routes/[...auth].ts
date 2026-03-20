import { Auth } from "@auth/core";
import Discord from "@auth/core/providers/discord";
import { createError, eventHandler, toWebRequest } from "h3";

export default eventHandler(async (event) => {
  const path = event.path ?? event.node?.req?.url ?? "";
  const pathname = path.split("?")[0] ?? path;

  if (!pathname.startsWith("/api/auth")) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not found",
      data: { error: "Not found" },
    });
  }

  return Auth(toWebRequest(event), {
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
    providers: [
      Discord({
        clientId: process.env.AUTH_DISCORD_ID,
        clientSecret: process.env.AUTH_DISCORD_SECRET,
      }),
    ],
  });
});
