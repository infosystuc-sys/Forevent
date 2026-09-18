"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { toast } from "@forevent/ui/toast";

const messages: Record<string, string> = {
  created: "Creado correctamente",
  updated: "Actualizado correctamente",
  deleted: "Dado de baja correctamente",
  published: "Evento publicado",
  paused: "Evento pausado",
  userDeactivated: "Cuenta desactivada",
  userActivated: "Cuenta reactivada",
  membershipRemoved: "Usuario quitado de la organización",
  roleUpdated: "Rol actualizado",
  staffCreated: "Super Usuario creado",
  staffActivated: "Super Usuario reactivado",
  staffDeactivated: "Super Usuario desactivado",
  staffPasswordReset: "Contraseña actualizada",
};

export default function AdminToastListener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const toastKey = searchParams.get("toast");
    const errorMessage = searchParams.get("error");
    if (!toastKey && !errorMessage) {
      return;
    }

    const message = toastKey ? messages[toastKey] : undefined;
    if (message) {
      toast.success(message);
    }
    if (errorMessage) {
      toast.error(errorMessage);
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    params.delete("error");
    const nextUrl = params.size ? `${pathname}?${params}` : pathname;
    router.replace(nextUrl);
  }, [pathname, router, searchParams]);

  return null;
}
