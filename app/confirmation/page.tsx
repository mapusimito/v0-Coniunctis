
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ConfirmacionEmail() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-background text-center">
      <div className="bg-card border rounded-2xl shadow-md p-8 max-w-md w-full">
        <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-4" />

        <h1 className="text-2xl font-bold text-foreground">¡Correo confirmado!</h1>

        <p className="mt-2 text-muted-foreground">
          Tu dirección de correo electrónico ha sido verificada con éxito.
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          Ahora puedes iniciar sesión y comenzar a usar la aplicación.
        </p>

        <Link href="/login">
          <Button className="mt-6 w-full">Ir al login</Button>
        </Link>
      </div>
    </div>
  );
}
