/**
 * Minimal Pusher WebSocket client for React Native / Hermes.
 * Uses the built-in WebSocket API (no browser DOM, no pusher-js package).
 *
 * Protocol: wss://ws-{cluster}.pusher.com/app/{key}?protocol=7
 * 1. On connect → receive pusher:connection_established { socket_id }
 * 2. For private-* channels: POST { socketId, channelName } to the backend
 *    auth endpoint, get back { auth }, then send pusher:subscribe { channel, auth }
 * 3. Receive { event, channel, data } for bound events
 */

const KEY     = process.env.EXPO_PUBLIC_PUSHER_KEY!;
const CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER!;
const WS_URL  = `wss://ws-${CLUSTER}.pusher.com/app/${KEY}?protocol=7&client=react-native&version=1.0`;

type Handler = (data: unknown) => void;
type Binding = { event: string; handler: Handler };
/** Resolves the `{ auth }` string for a private channel via the backend. */
export type Authorizer = (socketId: string, channelName: string) => Promise<{ auth: string }>;

class PusherNativeClient {
  private ws: WebSocket | null = null;
  // channelName → set of bindings
  private channels = new Map<string, Set<Binding>>();
  // channelName → authorizer, only set for private-* channels
  private authorizers = new Map<string, Authorizer>();
  private socketId: string | null = null;
  private reconnectDelay = 1_000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Connection ──────────────────────────────────────────────────────────────

  private connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const ws = new WebSocket(WS_URL);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectDelay = 1_000; // reset backoff on successful connect
    };

    ws.onmessage = (e: MessageEvent) => {
      let msg: { event: string; channel?: string; data?: unknown };
      try {
        msg = JSON.parse(e.data as string);
      } catch {
        return;
      }

      if (msg.event === "pusher:connection_established") {
        const info =
          typeof msg.data === "string" ? (JSON.parse(msg.data) as { socket_id: string }) : null;
        this.socketId = info?.socket_id ?? null;
        // Re-subscribe to all channels that were registered before reconnect
        // (private channels re-run their authorizer since the socket_id changed).
        this.channels.forEach((_, ch) => void this.sendSubscribe(ch));
        return;
      }

      if (!msg.channel) return;
      const bindings = this.channels.get(msg.channel);
      if (!bindings) return;

      // Pusher sends data as a JSON string inside the JSON envelope
      let payload = msg.data;
      if (typeof payload === "string") {
        try { payload = JSON.parse(payload); } catch { /* leave as string */ }
      }

      bindings.forEach((b) => {
        if (b.event === msg.event) b.handler(payload);
      });
    };

    ws.onerror = () => {
      // onclose fires right after; reconnect logic lives there
    };

    ws.onclose = () => {
      this.ws = null;
      // Exponential backoff, capped at 30 s
      this.reconnectTimer = setTimeout(() => {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
        this.connect();
      }, this.reconnectDelay);
    };
  }

  private async sendSubscribe(channelName: string): Promise<void> {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    let auth: string | undefined;
    if (channelName.startsWith("private-")) {
      const authorizer = this.authorizers.get(channelName);
      if (!authorizer || !this.socketId) return; // no autorizador o socket aún no listo
      try {
        const result = await authorizer(this.socketId, channelName);
        auth = result.auth;
      } catch {
        // El usuario no es participante (o falló la llamada) — no nos suscribimos.
        return;
      }
    }

    if (this.ws.readyState !== WebSocket.OPEN) return; // pudo cerrarse durante el await
    this.ws.send(
      JSON.stringify({
        event: "pusher:subscribe",
        data: { channel: channelName, ...(auth ? { auth } : {}) },
      }),
    );
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Subscribe to a channel. For `private-*` channels, `authorizer` is required —
   * it's called with `(socketId, channelName)` and must resolve `{ auth }` from
   * the backend, which only signs it if the user is actually a participant.
   */
  subscribe(channelName: string, authorizer?: Authorizer): void {
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, new Set());
    }
    if (authorizer) this.authorizers.set(channelName, authorizer);
    this.connect();
    void this.sendSubscribe(channelName);
  }

  unsubscribe(channelName: string): void {
    this.channels.delete(channelName);
    this.authorizers.delete(channelName);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          event: "pusher:unsubscribe",
          data: { channel: channelName },
        }),
      );
    }
  }

  /** Bind a handler to an event on a channel. Returns an unbind cleanup fn. */
  bind(channelName: string, event: string, handler: Handler): () => void {
    if (!this.channels.has(channelName)) {
      this.subscribe(channelName);
    }
    const binding: Binding = { event, handler };
    this.channels.get(channelName)!.add(binding);
    return () => {
      this.channels.get(channelName)?.delete(binding);
    };
  }
}

export const pusherClient = new PusherNativeClient();
