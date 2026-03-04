
export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {

    return (
        <div className='flex-1'>
            {/* <LoadAndUpdate guilds={guilds} isVerified={isVerified} /> */}
            {children}
        </div>
    )
}
