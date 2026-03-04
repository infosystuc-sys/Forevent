-- AlterTable: Agregar giftId a UserTicket para vínculo 1:1 con Gift
ALTER TABLE "UserTicket" ADD COLUMN "giftId" TEXT;

-- Migración de datos: Vincular UserTickets que ya tienen un regalo PENDING/ACCEPTED
-- Si hay múltiples gifts por ticket (edge case), toma el más reciente
UPDATE "UserTicket" ut
SET "giftId" = (
  SELECT g.id FROM "Gift" g
  WHERE g."userTicketId" = ut.id AND g.discharged = true
    AND g.status IN ('PENDING', 'ACCEPTED')
  ORDER BY g."createdAt" DESC LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM "Gift" g
  WHERE g."userTicketId" = ut.id AND g.discharged = true
    AND g.status IN ('PENDING', 'ACCEPTED')
);

-- Crear índice único para la relación 1:1 (Prisma lo genera como _key)
CREATE UNIQUE INDEX IF NOT EXISTS "UserTicket_giftId_key" ON "UserTicket"("giftId");

-- Crear índice para consultas por giftId
CREATE INDEX IF NOT EXISTS "UserTicket_giftId_idx" ON "UserTicket"("giftId");

-- FK: UserTicket.giftId -> Gift.id (onDelete SET NULL para que al borrar Gift se limpie)
ALTER TABLE "UserTicket" ADD CONSTRAINT "UserTicket_giftId_fkey" 
  FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
