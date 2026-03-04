"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@forevent/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/app/_components/ui/alert-dialog";

function ConfirmButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <AlertDialogAction type="submit" disabled={pending}>
      {pending ? "Borrando..." : label}
    </AlertDialogAction>
  );
}

export default function DeleteEventButton({
  action,
  label = "Borrar",
}: {
  action: () => void;
  label?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive">
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar evento</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El evento y sus datos asociados se
            eliminarán permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={action}>
            <ConfirmButton label={label} />
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
