import { createTRPCRouter } from "../trpc";
import { authRouter } from "./mobile/auth";
import { chatRouter } from "./mobile/chat";
import { employeeOnEventRouter } from "./mobile/employeeonevent";
import { eventRouter } from "./mobile/event";
import { inviteRouter } from "./mobile/invite";
import { joinInviteRouter } from "./mobile/joininvite";
import { messageRouter } from "./mobile/message";
import { postRouter } from "./mobile/post";
import { productRouter } from "./mobile/product";
import { purchaseRouter } from "./mobile/purchase";
import { testRouter } from "./mobile/test";
import { uploadRouter } from "./mobile/upload";
import { userRouter } from "./mobile/user";
import { userOnEventRouter } from "./mobile/useronevent";
import { userOnGuildRouter } from "./mobile/useronguild";
import { userPurchaseRouter } from "./mobile/userpurchase";
import { userTicketRouter } from "./mobile/userticket";
import { eventTicketRouter } from "./web/eventticket";

export const mobileRouter = createTRPCRouter({
    auth: authRouter,
    test: testRouter,
    upload: uploadRouter,
    chat: chatRouter,
    employeeOnEvent: employeeOnEventRouter,
    event: eventRouter,
    eventTicket: eventTicketRouter,
    invite: inviteRouter,
    joinInvite: joinInviteRouter,
    message: messageRouter,
    post: postRouter,
    product: productRouter,
    purchase: purchaseRouter,
    user: userRouter,
    userOnEvent: userOnEventRouter,
    userOnGuild: userOnGuildRouter,
    userPurchase: userPurchaseRouter,
    userTicket: userTicketRouter,

});