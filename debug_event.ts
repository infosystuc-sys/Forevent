import prisma from "./packages/db/src";

async function main() {
  const eventId = "69578815-d577-44d8-87a2-a96b72e6062c";

  // Filtros idénticos a mobile.event.highlighted
  const baseWhere = {
    discharged: true,
    private: false,
    status: "ACCEPTED" as const,
  };

  console.log("Buscando evento con filtros de highlighted...", { eventId, baseWhere });

  const eventWithFilters = await prisma.event.findFirst({
    where: {
      id: eventId,
      ...baseWhere,
    },
  });

  console.log("Resultado con filtros de highlighted:", eventWithFilters);

  const rawEvent = await prisma.event.findUnique({
    where: { id: eventId },
  });

  console.log("Evento sin filtros (tal cual en BD):", rawEvent);
}

main()
  .catch((e) => {
    console.error("Error en debug_event.ts", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

