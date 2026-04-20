"use client"

import type { ArrayElement, RouterOutputs } from "@forevent/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "~/app/_components/ui/alert-dialog";
import { Button } from "~/app/_components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "~/app/_components/ui/dropdown-menu";
import { api } from "~/trpc/react";

export function Actions({ original }: { original: ArrayElement<Awaited<RouterOutputs["web"]["event"]["byGuildId"]>["rows"]> }) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const router = useRouter();
    const utils = api.useUtils();

    const deleteEvent = api.web.event.delete.useMutation({
        onSuccess: async () => {
            await utils.web.event.byGuildId.invalidate();
            setDeleteOpen(false);
        },
    });

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">Acciones</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/v1/${original.guildId}/events/${original.id}`)}>
                        Ver evento
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push(`/v1/${original.guildId}/events/${original.id}/edit`)}>
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onClick={() => setDeleteOpen(true)}
                    >
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="max-w-xl">
                    <AlertDialogHeader className="space-y-4">
                        <AlertDialogTitle className="text-xl">Confirmar eliminación</AlertDialogTitle>
                        <AlertDialogDescription className="leading-6">
                            Estás por eliminar permanentemente <strong>{original?.name}</strong> de tu organización.
                            Esta acción no se puede deshacer. ¿Deseás continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-end">
                        <AlertDialogCancel disabled={deleteEvent.isPending}>Cancelar</AlertDialogCancel>
                        <Button
                            variant="destructive"
                            disabled={deleteEvent.isPending}
                            onClick={() => deleteEvent.mutate({ eventId: original.id, guildId: original.guildId })}
                        >
                            {deleteEvent.isPending ? "Eliminando..." : "Eliminar"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
