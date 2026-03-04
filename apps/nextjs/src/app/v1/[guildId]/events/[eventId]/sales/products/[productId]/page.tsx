import { Avatar, AvatarFallback, AvatarImage } from "~/app/_components/ui/avatar"
import { api } from "~/trpc/server"
import { DataTable } from "./data-table"

export default async function ProductSalesPage ({ params }: { params: { productId: string, eventId: string } }) {
    const exchanges = await api.web.userPurchase.exchanges({ productId: params.productId, eventId: params.eventId })
    // console.log(userPurchases, 'USER PURCHASE')
    const product = await api.web.product.byId({ productId: params.productId })
    // console.log("exx", exchanges, 'exchangesddd')

    if (!product || !product.discharged) {
        return (
            <div className="container h-screen">
                <h1>Producto no encontrado</h1>
                <p>Este producto no existe o no está disponible</p>
            </div>
        )
    }

    return (
        <div className="flex-1 rounded-xl container flex-col">
            <div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Detalles de canje</h1>
                </div>
                <div className="flex items-center gap-6 mt-10">
                    <div className="w-min">
                        <Avatar className="h-40 w-40">
                            <AvatarImage
                                src={product.image ?? ""}
                                alt={"image"}
                            />
                            <AvatarFallback className="text-lg bg-neutral-900">{product.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h3 className="text-2xl font-light">{product.name}</h3>
                        <p className="text-primary">{product.about}</p>
                        <p>Precio: ${product.price}</p>
                    </div>
                </div>
            </div>
            <DataTable data={exchanges} />
        </div>
    )
}