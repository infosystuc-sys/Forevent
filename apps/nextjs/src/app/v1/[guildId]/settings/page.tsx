import { Separator } from "~/app/_components/ui/separator"

export default function SettingsProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Datos de la organización</h3>
        <p className="text-sm text-muted-foreground">
          Asi es como tus empleados te veran en la plataforma.
        </p>
      </div>
      <Separator />
      {/* <ProfileForm /> */}
    </div>
  )
}
