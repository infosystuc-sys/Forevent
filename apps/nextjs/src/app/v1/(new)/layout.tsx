import React, { Suspense } from 'react'
import AdminNav from '~/app/_components/admin/nav'

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className='flex-1'>
            <Suspense fallback={<div className="border-b h-24" />}>
                <AdminNav options={{ logo: true, menu: true, nav: false, selector: false }} />
            </Suspense>
            {children}
        </div>
    )
}
