import { redirect } from "next/navigation"

/**
 * El alta de organizaciones pasó a ser exclusiva del equipo Forevent
 * (/internal/v1/guilds). La ruta se conserva como redirección para no
 * romper enlaces guardados.
 */
export default function CreateGuild() {
    redirect("/v1/welcome")
}
