import { NewPasswordForm } from "~/app/_components/auth/newpassword-form";

export default function NewPasswordPage({
    params,
    searchParams,
}: {
    params: { slug: string };
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    return (
        <div className="flex-1 py-20">
            <div className="h-screen flex items-center justify-center">
                <div className="flex w-full flex-col items-center space-y-6 sm:w-[25rem]">
                    <div className="relative z-20 flex items-center text-lg gap-2 font-medium h-32 w-32">
                        <svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 450 600" className=" flex-1 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <path
                                fill="#FFF"
                                d="M0 523.63V134.27A134.27 134.27 0 01134.27 0h228.65a72.59 72.59 0 010 145.17H188.75a43.57 43.57 0 100 87.13h174.17a72.59 72.59 0 010 145.17H188.75a43.57 43.57 0 00-43.57 43.56v102.6a72.58 72.58 0 11-145.16 0"
                            />
                            <path
                                d="M362.92 450.86H235.66a17.91 17.91 0 00-17.91 17.91v54.67a72.59 72.59 0 01-72.59 72.59h217.76a72.59 72.59 0 000-145.17"
                                fill="#a6539b"
                            />
                        </svg>
                    </div>
                    <NewPasswordForm id={searchParams?.id! as string} />
                </div>
            </div>
        </div>
    )
}