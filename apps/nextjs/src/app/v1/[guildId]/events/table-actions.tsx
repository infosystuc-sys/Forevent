import type { ArrayElement, RouterOutputs } from "@forevent/api";
import Link from "next/link";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "~/app/_components/ui/alert-dialog";
import { Button } from "~/app/_components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "~/app/_components/ui/dropdown-menu";

export function Actions({ original }: { original: ArrayElement<Awaited<RouterOutputs["web"]["event"]["byGuildId"]>> }) {
    // console.log(path, "PATH")
    const [open, setOpen] = useState(false);
    // const utils = api.useUtils()
    // const dischargeLocation = api.web.location.modifyLocation.useMutation({
    //     onSuccess: async (res) => {
    //         console.log(res, "success")
    //         await utils.web.location.getLocations.invalidate()
    //         toast("Ubicacion dada de baja con exito", {
    //             description: `${res.name} fue dada de baja a las ${customdayjs(res.createdAt).format("HH:mm")}`,
    //             action: {
    //                 label: "Cerrar",
    //                 onClick: () => router.refresh(),
    //             },
    //             onDismiss: () => { router.refresh() }
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
        <AlertDialog open={open} onOpenChange={setOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        {/* <span className="sr-only">Ver evento</span> */}
                        Ver evento
                        {/* <MoreHorizontal className="h-6 w-6" /> */}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {/* <Link rel="noopener noreferrer" target="_blank" href={`${GOOGLE_MAPS_URL}${original?.latitude},${original?.longitude}`} passHref={true}>
                        <DropdownMenuItem>
                            Ver en el mapa
                        </DropdownMenuItem>
                    </Link> */}
                    <DropdownMenuSeparator />
                    <Link href={{ pathname: `locations/modify`, query: { locationId: original?.id } }}>
                        <DropdownMenuItem>
                            Modificar
                        </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
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
                        Estas por dar de baja permanentemente <code className="">{original?.name}</code> de tu organización.
                        Deseas continuar?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {/* <AlertDialogFooter className="sm:justify-end">
                    <AlertDialogCancel disabled={dischargeLocation.isPending}>Cancelar</AlertDialogCancel>
                    <Button disabled={dischargeLocation.isPending} onClick={() => {
                        console.log("ON SUBMIT")
                        dischargeLocation.mutate({ locationId: original?.id, discharged: false })
                    }}>
                        {dischargeLocation.isPending ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : "Continuar"}
                    </Button>
                </AlertDialogFooter> */}
            </AlertDialogContent>
        </AlertDialog>
    )
}