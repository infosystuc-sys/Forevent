import { useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "~/app/_components/ui/alert-dialog"

export function DischargeEmployee(data: { employeeId: string }) {
    const [open, setOpen] = useState(false)
    return (
        <>
            <div className="hover:bg-red-500 rounded " onClick={() => setOpen(true)}>
                <div className="text-sm px-2 py-1">Dar baja</div>
            </div>
            {/* <DropdownMenuItem onClick={() => setOpen(true)}>Dar baja</DropdownMenuItem> */}
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            account and remove your data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction>Continuar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}