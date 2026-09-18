"use client"

import type { ReactNode } from "react"
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

function SubmitButton({ label, destructive }: { label: string; destructive: boolean }) {
    const { pending } = useFormStatus()
    return (
        <AlertDialogAction
            type="submit"
            disabled={pending}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
        >
            {pending ? "Procesando..." : label}
        </AlertDialogAction>
    )
}

/** Botón que pide confirmación antes de ejecutar un server action. */
export default function ConfirmActionButton({
    action,
    trigger,
    title,
    description,
    confirmLabel,
    destructive = false,
    variant = "outline",
    className,
}: {
    action: () => Promise<void>
    trigger: ReactNode
    title: string
    description: ReactNode
    confirmLabel: string
    destructive?: boolean
    variant?: "outline" | "secondary" | "destructive" | "ghost"
    className?: string
}) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="sm" variant={variant} className={className}>
                    {trigger}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <form action={action}>
                        <SubmitButton label={confirmLabel} destructive={destructive} />
                    </form>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
