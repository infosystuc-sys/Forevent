import { useCallback, useEffect, useRef } from "react";
import { pusherClient } from "~/utils/socket";
import { api } from "~/utils/api";

/**
 * Manages a Pusher channel subscription for a chat screen.
 *
 * - Subscribes to `private-chat-${chatId}` on mount, unsubscribes on unmount.
 *   It's a private channel: the backend (`mobile.chat.pusherAuth`) only signs
 *   the subscription if the user is actually a participant of that chat.
 * - Returns `onMessage(handler)` — binds `handler` to the `new-message`
 *   event and returns a cleanup that unbinds it.
 */
export function usePusher(chatId: string | undefined) {
  const pusherAuth = api.mobile.chat.pusherAuth.useMutation();
  // Ref so `subscribe()` (called once per chatId in the effect below) always
  // has a stable function identity to pass down — it still calls through to
  // the live `pusherAuth.mutateAsync` via the tRPC client, not a frozen copy.
  const authorizerRef = useRef(
    async (socketId: string, channelName: string) =>
      pusherAuth.mutateAsync({ socketId, channelName }),
  );

  useEffect(() => {
    if (!chatId) return;
    const channel = chatChannelName(chatId);
    pusherClient.subscribe(channel, authorizerRef.current);
    return () => {
      pusherClient.unsubscribe(channel);
    };
  }, [chatId]);

  const onMessage = useCallback(
    (handler: (msg: unknown) => void): (() => void) => {
      if (!chatId) return () => {};
      return pusherClient.bind(chatChannelName(chatId), "new-message", handler);
    },
    [chatId],
  );

  return { onMessage };
}

function chatChannelName(chatId: string): string {
  return `private-chat-${chatId}`;
}
