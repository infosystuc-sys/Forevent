"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { KeyRound } from "lucide-react"

import { Button } from "@forevent/ui/button"
import { Input } from "@forevent/ui/input"
import { Label } from "@forevent/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/app/_components/ui/dialog"

import { createStaffAction, resetStaffPasswordAction, type ActionState } from "./actions"

const initialState: ActionState = { error: null }

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? busy : idle}
        </Button>
    )
}

/** Alta de un nuevo Super Usuario. La contraseña es temporal: se pide cambiarla al primer ingreso. */
export function CreateStaffForm() {
    const [state, formAction] = useFormState(createStaffAction, initialState)

    return (
        <form action={formAction} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
                <Label htmlFor="staff-name">Nombre</Label>
                <Input id="staff-name" name="name" required minLength={2} placeholder="Nombre y apellido" />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="staff-email">Email</Label>
                <Input id="staff-email" name="email" type="email" required placeholder="persona@forevent.com" />
                <p className="text-xs text-muted-foreground">Si usa Google con este email, también podrá entrar así.</p>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="staff-password">Contraseña temporal</Label>
                <Input id="staff-password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
            </div>
            {state.error && (
                <p className="md:col-span-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {state.error}
                </p>
            )}
            <div className="md:col-span-3">
                <SubmitButton idle="Crear Super Usuario" busy="Creando..." />
            </div>
        </form>
    )
}

/** Reset de contraseña de otro Super Usuario (o la propia), en un diálogo. */
export function ResetPasswordDialog({ id, name, isMe }: { id: string; name: string; isMe: boolean }) {
    const [open, setOpen] = useState(false)
    const [state, formAction] = useFormState(resetStaffPasswordAction.bind(null, id), initialState)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" />
                    {isMe ? "Cambiar mi contraseña" : "Resetear contraseña"}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isMe ? "Cambiar mi contraseña" : `Nueva contraseña para ${name}`}</DialogTitle>
                    <DialogDescription>
                        {isMe
                            ? "Vas a seguir logueado; usá la nueva contraseña en el próximo ingreso."
                            : "Pasale la contraseña por un canal seguro. Se le pedirá cambiarla al ingresar."}
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor={`pw-${id}`}>Nueva contraseña</Label>
                        <Input id={`pw-${id}`} name="password" type="password" required minLength={8} autoComplete="new-password" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor={`pw2-${id}`}>Repetir contraseña</Label>
                        <Input id={`pw2-${id}`} name="confirm" type="password" required minLength={8} autoComplete="new-password" />
                    </div>
                    {state.error && (
                        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {state.error}
                        </p>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <SubmitButton idle="Guardar" busy="Guardando..." />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
