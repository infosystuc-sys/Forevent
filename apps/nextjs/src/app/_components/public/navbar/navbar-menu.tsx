import { Session } from "@forevent/auth";
import Link from "next/link";
import { buttonVariants } from "../../ui/button";


export default function NavBarMenu({ session }: { session: Session | null }) {
    return (
        <ul className="flex flex-col lg:flex-row gap-6 justify-end lg:justify-center lg:items-center font-extralight">
            <li>
                <Link href="/workwithus" className={`nav-link text-[1.125rem] tracking-wide`}>Trabaja con nosotros</Link>
                <span className={`bg-primary block w-0 transition-all duration-500 h-px`}></span>
            </li>
            <li>
                <Link href="/aboutus" className={`nav-link text-[1.125rem] tracking-wide`}>Sobre nosotros</Link>
                <span className={`bg-primary block w-0 transition-all duration-500 h-px`}></span>
            </li>
            <li>
                <Link href="/help" className={`nav-link text-[1.125rem] tracking-wide nav-link`}>Ayuda</Link>
                <span className={`bg-primary block w-0 transition-all duration-500 h-px`}></span>
            </li>
            <li>
                {session ?
                    <Link href="/v1" className={buttonVariants({ variant: "default", className: "block w-full lg:inline" })}>
                        Dashboard
                    </Link>
                    :
                    <>
                        <Link href="/login" className={`nav-link text-[1.125rem] tracking-wide`}>Iniciar sesión</Link>
                        <span className={`bg-primary block w-0 transition-all duration-500 h-px`}></span>
                    </>
                }
            </li>
        </ul>
    )
}