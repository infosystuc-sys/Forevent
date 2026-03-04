'use client'

import { Frown } from "lucide-react"
import { redirect, useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import { Button } from "~/app/_components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  console.log(JSON.stringify(error), "error")

  useEffect(() => {
    if (error.name === "UNAUTHORIZED") {
      toast("No autorizado", {
        description: "Debes estar autenticado para ver esta pagina",
        action: {
          label: "Cerrar",
          onClick: () => console.log("cerrar"),
        },
      })
      redirect("/login")
    }
  }, [error])
  return (
    <html>
      <body>
        <main className="min-h-screen bg-gray-200 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <Frown className="mx-auto h-12 w-auto" />
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Oops... Algo salio mal</h2>
              <p>{error.name} {error.message}</p>
              <p className="mt-2 text-center text-xl text-gray-600">
                Nos disculpamos por las molestias. Nuestro equipo está trabajando en ello. Mientras tanto, puedes intentar recargar esta pagina.
              </p>
            </div>
            <div className="mt-5 flex justify-center">
              <Button
                variant="outline"
                onClick={() => { router.refresh(); router.push("/v1") }}
              >
                Recargar pagina
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}