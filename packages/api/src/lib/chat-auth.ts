import { TRPCError } from "@trpc/server";
import type prismaClient from "@forevent/db";

/** Prefijo del canal Pusher privado de un chat. Único lugar donde se define. */
export const CHAT_CHANNEL_PREFIX = "private-chat-";
export const chatChannelName = (chatId: string) => `${CHAT_CHANNEL_PREFIX}${chatId}`;

/**
 * Verifica que `userId` sea participante del chat (DM o canal). Misma lógica
 * usada por chat.byId, message.all, message.create y pusherAuth — centralizada
 * para que los cuatro puntos de entrada no puedan divergir.
 */
export async function assertChatParticipant(
  prisma: typeof prismaClient,
  userId: string,
  chatId: string,
) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: {
      type: true,
      eventId: true,
      requester: { select: { userId: true } },
      receiver: { select: { userId: true } },
    },
  });

  if (!chat) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Chat no encontrado." });
  }

  if (chat.type === "DM") {
    const isParticipant =
      chat.requester?.userId === userId || chat.receiver?.userId === userId;
    if (!isParticipant) {
      throw new TRPCError({ code: "FORBIDDEN", message: "No sos participante de este chat." });
    }
  } else {
    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!participant) {
      throw new TRPCError({ code: "FORBIDDEN", message: "No formas parte de este canal." });
    }
  }

  return chat;
}
