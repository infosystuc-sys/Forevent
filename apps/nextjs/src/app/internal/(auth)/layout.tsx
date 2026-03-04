
export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {

    return (
        <div className='flex-1'>
            {children}
        </div>
    )
}
