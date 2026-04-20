import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: process.env.DEBUG_PRISMA === "1" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV === "development") global.prisma = prisma;

export * from "@prisma/client";

// Turbopack does not always re-export CJS named bindings through `export *`.
// Explicitly re-export the schema enums that pages import as runtime values
// (importing as `import { Status } from "@forevent/db"`). Without this, the
// import resolves to `undefined` under `next dev --turbo`.
export {
  GlobalRole,
  Status,
  ProductType,
  TransferType,
  EventCategory,
  RelationshipType,
  PaymentType,
  ClaimType,
  Role,
  Prisma,
} from "@prisma/client";

export default prisma;
