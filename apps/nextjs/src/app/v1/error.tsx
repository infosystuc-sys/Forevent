'use client'

import { Frown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import { Button } from "~/app/_components/ui/button"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  const router = useRouter()
  console.log(JSON.stringify(error), "error")

  useEffect(() => {
    if (error.message === "UNAUTHORIZED") {
      toast("No autorizado", {
        description: "Debes estar autenticado para ver esta pagina",
        action: {
          label: "Cerrar",
          onClick: () => console.log("cerrar"),
        },
      })
      router.push("/login")
    }
  }, [error, router])

  return (
    <main className="flex flex-1 h-screen items-center justify-center">
      <div className="max-w-md w-full  space-y-8">
        <div>
          <Frown className="mx-auto h-24 w-auto text-red-500" />
          <h2 className="mt-6 text-center text-3xl font-extrabold">Oops... Algo salio mal</h2>
          <p className="mt-2 text-center">{error.name} {error.message}</p>
          <p className="mt-2 text-center text-neutral-400">
            Nos disculpamos por las molestias. Nuestro equipo está trabajando en ello. Mientras tanto, puedes intentar recargar esta pagina.
          </p>
        </div>
        <div className="mt-5 flex justify-center">
          <Button
            variant="outline"
            onClick={() => { router.refresh() }}
          >
            Recargar pagina
          </Button>
        </div>
      </div>
    </main>
  )
}