import type { ArrayElement, RouterOutputs } from "@forevent/api";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "~/app/_components/ui/alert-dialog";
import { Button } from "~/app/_components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "~/app/_components/ui/dropdown-menu";
import { Icons } from '~/app/_components/ui/icons';


export default function Actions({ original }: { original: ArrayElement<Awaited<RouterOutputs["web"]["userOnEvent"]["all"]>> }) {
    // console.log(path, "PATH")
    const [open, setOpen] = useState(false);
    // const utils = api.web.useUtils()

    // const dischargeEmployee = api.web.userOnGuild.modifyEmployee.useMutation({
    //     onSuccess: async (res) => {
    //         console.log(res, "success")
    //         await utils.mobile.userOnGuild.getEmployees.invalidate()
    //         toast("Empleado dado de baja con exito", {
    //             description: `El empleado fue dado de baja a las ${customdayjs().format("HH:mm")}`,
    //             action: {
    //                 label: "Cerrar",
    //                 onClick: () => console.log("cerrar"),
    //             },
    //         })
    //         setOpen(false)
    //         router.refresh()
    //     },
    //     onError: (error) => {
    //         console.log(error.data, error.message, error.shape, "error")
    //         toast("Ocurrio un error", {
    //             description: `${error.message}`,
    //             // action: {
    //             //   label: "Cerrar",
    //             //   onClick: () => console.log("Undo"),
    //             // },
    //         })
    //     }
    // })

    return (
        <>
            <AlertDialog open={open} onOpenChange={setOpen}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-6 w-6" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <AlertDialogTrigger onClick={() => { setOpen(true) }} className="w-full">
                            <DropdownMenuItem className="w-full">
                                Dar de baja
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent className="max-w-xl">
                    <AlertDialogHeader className="space-y-4">
                        <AlertDialogTitle className="text-xl">Confimar baja</AlertDialogTitle>
                        <AlertDialogDescription className="leading-6">
                            Estas por quitar a <code className="">{original.user.name}</code> de este evento.
                            ¿Deseas continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-end">
                        {/* <AlertDialogCancel disabled={dischargeEmployee.isPending}>Cancelar</AlertDialogCancel>
                    <Button disabled={dischargeEmployee.isPending} onClick={() => {
                        console.log("ON SUBMIT")
                        dischargeEmployee.mutate({ employeeId: original?.id, discharged: false })
                    }}>
                        {dischargeEmployee.isPending ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : "Continuar"}
                    </Button> */}

                        {/* es solo pa ver como queda */}
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <Button>
                            {false ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : "Continuar"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}