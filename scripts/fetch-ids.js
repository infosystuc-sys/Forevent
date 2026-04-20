import db from "@forevent/db";

const guildId = "cmm2ufi460001lw15io7a1m6l";
const eventId = "69578815-d577-44d8-87a2-a96b72e6062c";

const [counter, deposit, deal, product, ticket, userOnGuild] = await Promise.all([
  db.counter.findFirst({ where: { eventId }, select: { id: true } }),
  db.deposit.findFirst({ where: { eventId }, select: { id: true } }),
  db.deal.findFirst({ where: { eventId }, select: { id: true } }),
  db.product.findFirst({ where: { eventId }, select: { id: true } }),
  db.eventTicket.findFirst({ where: { eventId }, select: { id: true } }),
  db.userOnGuild.findFirst({ where: { guildId }, select: { id: true } }),
]);

console.log(JSON.stringify({ counter, deposit, deal, product, ticket, userOnGuild }, null, 2));
process.exit(0);
