"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@forevent/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/app/_components/ui/alert-dialog"
import { Trash2 } from "lucide-react"

function ConfirmButton() {
    const { pending } = useFormStatus()
    return (
        <AlertDialogAction type="submit" disabled={pending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {pending ? "Eliminando..." : "Sí, eliminar definitivamente"}
        </AlertDialogAction>
    )
}

export default function DeleteOrganizationButton({
    orgName,
    action,
}: {
    orgName: string
    action: () => Promise<void>
}) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" className="gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar definitivamente
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar organización?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Estás por eliminar permanentemente <span className="font-semibold text-foreground">{orgName}</span>.
                        Esta acción <span className="font-semibold text-destructive">no se puede deshacer</span> y borrará
                        todos los datos asociados (miembros, invitaciones, etc.).
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <form action={action}>
                        <ConfirmButton />
                    </form>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
