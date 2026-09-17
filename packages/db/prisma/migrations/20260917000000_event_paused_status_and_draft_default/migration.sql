-- Estado PAUSADO para eventos (PDF §9): distinto de DRAFT, que pasa a ser sólo "borrador".
ALTER TYPE "Status" ADD VALUE IF NOT EXISTS 'PAUSED';

-- Los eventos nacen como borrador y el dueño los envía a aprobación explícitamente (PDF §8).
ALTER TABLE "Event" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
