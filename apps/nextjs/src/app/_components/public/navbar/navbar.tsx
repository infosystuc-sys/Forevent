import { Session } from "@forevent/auth"
import { MenuIcon } from "lucide-react"
import Link from "next/link"
import {
    Sheet,
    SheetContent, SheetHeader, SheetTrigger
} from "~/app/_components/ui/sheet"
import { Button } from "../../ui/button"
import NavBarMenu from "./navbar-menu"
import './navBar.css'

import React from 'react'

export default function NavBar({ session }: { session: Session | null }) {
    return (
        <nav className={`transition-all duration-500 w-full bg-black/65 backdrop-blur-md text-white`}>
            <div className="py-1 container">
                <div className="flex justify-between items-center">
                    <Link href="/">
                        <div className="my-3">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 435.5 596.21"
                                className="w-10 h-10"
                            >
                                <path
                                    d="M0 523.63V134.27A134.27 134.27 0 01134.27 0h228.65a72.59 72.59 0 010 145.17H188.75a43.57 43.57 0 100 87.13h174.17a72.59 72.59 0 010 145.17H188.75a43.57 43.57 0 00-43.57 43.56v102.6a72.58 72.58 0 11-145.16 0"
                                    fill="#fff"
                                />
                                <path
                                    d="M362.92 450.86H235.66a17.91 17.91 0 00-17.91 17.91v54.67a72.59 72.59 0 01-72.59 72.59h217.76a72.59 72.59 0 000-145.17"
                                    fill="#a6539b"
                                />
                            </svg>
                        </div>
                    </Link>
                    <div className="flex justify-center items-center gap-1">
                        <div className="hidden lg:flex gap-2 items-center justify-center">
                            <NavBarMenu session={session} />
                        </div>
                        <div className="lg:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="link" className="">
                                        <MenuIcon className="" />
                                        <span className="hidden">Menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="bg-black/85 backdrop-blur text-white">
                                    <SheetHeader className="mb-4">
                                        <div className="flex items-center">
                                            <Link href="/">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 435.5 596.21"
                                                    className="w-10 h-10"
                                                >
                                                    <path
                                                        d="M0 523.63V134.27A134.27 134.27 0 01134.27 0h228.65a72.59 72.59 0 010 145.17H188.75a43.57 43.57 0 100 87.13h174.17a72.59 72.59 0 010 145.17H188.75a43.57 43.57 0 00-43.57 43.56v102.6a72.58 72.58 0 11-145.16 0"
                                                        fill="#fff"
                                                    />
                                                    <path
                                                        d="M362.92 450.86H235.66a17.91 17.91 0 00-17.91 17.91v54.67a72.59 72.59 0 01-72.59 72.59h217.76a72.59 72.59 0 000-145.17"
                                                        fill="#a6539b"
                                                    />
                                                </svg>
                                            </Link>
                                            <h2 className="text-lg font-medium align-middle">
                                                Forevent
                                            </h2>
                                        </div>
                                    </SheetHeader>
                                    <div className="flex flex-col justify-center">
                                        <NavBarMenu session={session} />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}