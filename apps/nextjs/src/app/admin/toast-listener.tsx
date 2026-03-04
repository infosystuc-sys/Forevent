"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { toast } from "@forevent/ui/toast";

const messages: Record<string, string> = {
  created: "Evento creado",
  updated: "Evento actualizado",
  deleted: "Evento eliminado",
  published: "Evento publicado",
  paused: "Evento pausado",
};

export default function AdminToastListener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const toastKey = searchParams.get("toast");
    if (!toastKey) {
      return;
    }

    const message = messages[toastKey];
    if (message) {
      toast.success(message);
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    const nextUrl = params.size ? `${pathname}?${params}` : pathname;
    router.replace(nextUrl);
  }, [pathname, router, searchParams]);

  return null;
}
