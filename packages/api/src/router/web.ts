import { artistRouter } from "./web/artist";
import { authRouter } from "./web/auth";
import { chatRouter } from "./web/chat";
import { claimRouter } from "./web/claim";
import { counterRouter } from "./web/counter";
import { dealRouter } from "./web/deal";
import { depositRouter } from "./web/deposit";
import { employeeOnEventRouter } from "./web/employeeonevent";
import { eventRouter } from "./web/event";
import { gateRouter } from "./web/gate";
import { guildRouter } from "./web/guild";
import { internalRouter } from "./web/internal";
import { inviteRouter } from "./web/invite";
import { itemOnPurchaseRouter } from "./web/itemonpurchase";
import { joinInviteRouter } from "./web/joininvite";
import { messageRouter } from "./web/message";
import { pictureRouter } from "./web/picture";
import { postRouter } from "./web/post";
import { productRouter } from "./web/product";
import { productOnDealRouter } from "./web/productondeal";
import { purchaseRouter } from "./web/purchase";
import { relationshipRouter } from "./web/relationship";
import { transferRouter } from "./web/transfer";
import { userRouter } from "./web/user";
import { userOnEventRouter } from "./web/useronevent";
import { userOnGuildRouter } from "./web/userOnGuild";
import { userPurchaseRouter } from "./web/userpurchase";
import { userTicketRouter } from "./web/userticket";
import { createTRPCRouter } from "../trpc";
import { locationRouter } from "./web/location";
import { cashierRouter } from "./web/cashier";
import { eventTicketRouter } from "./web/eventticket";

export const webRouter = createTRPCRouter({
    artist: artistRouter,
    cashier: cashierRouter,
    chat: chatRouter,
    claim: claimRouter,
    counter: counterRouter,
    deal: dealRouter,
    deposit: depositRouter,
    employeeOnEvent: employeeOnEventRouter,
    event: eventRouter,
    eventTicket: eventTicketRouter,
    gate: gateRouter,
    guild: guildRouter,
    invite: inviteRouter,
    itemOnPurchase: itemOnPurchaseRouter,
    joinInvite: joinInviteRouter,
    message: messageRouter,
    picture: pictureRouter,
    post: postRouter,
    product: productRouter,
    productOnDeal: productOnDealRouter,
    purchase: purchaseRouter,
    relationship: relationshipRouter,
    transfer: transferRouter,
    user: userRouter,
    userOnEvent: userOnEventRouter,
    userOnGuild: userOnGuildRouter,
    userPurchase: userPurchaseRouter,
    userTicket: userTicketRouter,
    internal: internalRouter,
    auth: authRouter,
    location: locationRouter,

});