/**
 * v0 by Vercel.
 * @see https://v0.dev/t/Xy8WLhP9sYq
 */
import Link from "next/link"
import { SVGProps } from "react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <AtSignIcon className="w-20 h-20 text-red-500" />
      <h1 className="mt-6 text-3xl font-semibold">Pagina no encontrada</h1>
      <p className="mt-2 text-lg text-neutral-400">
        Perdón, la página que buscas no existe. Por favor, verifica la URL o regresa al inicio.
      </p>
      <Link
        className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        href="/"
      >
        <HomeIcon className="w-5 h-5 mr-2" />
        Volver al inicio
      </Link>
    </div>
  )
}

function AtSignIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
    </svg>
  )
}


function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
