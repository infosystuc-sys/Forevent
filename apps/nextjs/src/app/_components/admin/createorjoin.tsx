"use client"

import type { Session } from '@forevent/auth'
import { Building2 } from 'lucide-react'
import {
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '~/app/_components/ui/card'

/**
 * Pantalla para usuarios que todavía no pertenecen a ninguna organización.
 *
 * Las organizaciones las da de alta el equipo de Forevent desde
 * /internal/v1/guilds, así que acá no hay autogestión: solo se explica
 * el camino y se ofrece el contacto.
 */
export default function CreateOrJoin({ session }: { session: Session | null }) {
    return (
        <div className='flex flex-1 items-center justify-center py-20'>
            <div className='w-full max-w-xl space-y-5'>
                <CardHeader className='items-center text-center'>
                    <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
                        <Building2 className='h-6 w-6 text-primary' />
                    </div>
                    <CardTitle>Bienvenido, {session?.user?.name}</CardTitle>
                    <CardDescription>
                        Tu cuenta todavía no está vinculada a ninguna organización.
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground'>
                        <p>
                            Si vas a organizar eventos, el equipo de Forevent da de alta tu
                            organización y te asigna como responsable. Escribinos a{' '}
                            <a
                                href='mailto:soporte@forevent.com.ar?subject=Alta%20de%20organizaci%C3%B3n'
                                className='font-medium text-primary hover:underline'
                            >
                                soporte@forevent.com.ar
                            </a>
                            .
                        </p>
                        <p className='mt-3'>
                            Si ya trabajás en una organización que usa Forevent, pedile a quien
                            la administra que te envíe una invitación desde el panel. Te va a
                            llegar por correo y la vas a ver en tu cuenta.
                        </p>
                    </div>
                </CardContent>
            </div>
        </div>
    )
}
