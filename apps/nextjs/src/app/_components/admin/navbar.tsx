"use client"

import type { RouterOutputs } from "@forevent/api";
import { ItemIndicator } from "@radix-ui/react-dropdown-menu";
import {
    CaretDownIcon,
    CheckIcon
} from "@radix-ui/react-icons";
import { Session } from "next-auth";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import * as React from "react";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "~/app/_components/ui/avatar";
import { Button } from "~/app/_components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "~/app/_components/ui/command";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "~/app/_components/ui/dropdown-menu";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle
} from "~/app/_components/ui/navigation-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/app/_components/ui/popover";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { handleSignOut } from "../auth/auth-action";
import { Badge } from "../ui/badge";

export default function AdminNavBar(
    { session, guilds: guilds, options, invites }: {
        session: Session | null,
        guilds: Awaited<RouterOutputs["web"]["guild"]["getGuilds"]>,
        options?: { nav: boolean, selector: boolean, menu: boolean, logo: boolean },
        invites: Awaited<RouterOutputs["web"]["userOnGuild"]["getInvites"]>
    }) {
    const router = useRouter()
    const [openLocationSelector, setOpenLocationSelector] = React.useState(false)
    const [openGuildSelector, setOpenGuildSelector] = React.useState(false)
    const { setTheme, theme } = useTheme()
    const params = useParams()
    const path = usePathname()

    async function onSignOut() {
        await handleSignOut()
    }

    const getGuilds = api.web.guild.getGuilds.useQuery({ email: session?.user.email! as string }, { initialData: guilds })

    const getInvites = api.web.userOnGuild.getInvites.useQuery({ email: session?.user.email! as string }, { initialData: invites })

    React.useEffect(() => {
        if (getGuilds.data.length > 0 && !params?.guildId) {
            switch (getGuilds.data[0]?.role) {
                case "OWNER":
                    // console.log("CASE 3")
                    router.push(`/v1/${getGuilds.data[0]?.id}`)
                    break;
                case "MANAGER":
                    // console.log("CASE 4")
                    router.push(`/v1/${getGuilds.data[0]?.id}`)
                    break;
                case "EMPLOYEE":
                    router.push(`/v1/${getGuilds.data[0]?.id}/cashier`)
                    break;
                default:
                    router.push("/unauthorized")
                    break;
            }
        } else if (getGuilds.data.length > 0 && params?.guildId) {
            switch (getGuilds.data[0]?.role) {
                case "OWNER":
                    // console.log("CASE 3")
                    // router.push(`/v1/${getGuilds.data[0]?.id}`)
                    break;
                case "MANAGER":
                    // console.log("CASE 4")
                    // router.push(`/v1/${getGuilds.data[0]?.id}`)
                    break;
                case "EMPLOYEE":
                    // router.push(`/v1/${getGuilds.data[0]?.id}/cashier`)
                    // break;
                    break;
                default:
                    router.push("/unauthorized")
                    break;
            }
        }
    }, [])

    return (
        <div className="border-b px-10">
            <div className={`flex flex-1 pt-4 justify-between items-center gap-5`}>
                {options?.logo &&
                    <Link href="/" className={`p-4 ${theme === "light" && "bg-black rounded-lg"}`}>
                        <div className="h-10 w-10">
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
                    </Link>
                }
                {options?.selector &&
                    <div className="flex items-center w-full">
                        <Popover open={openGuildSelector} onOpenChange={setOpenGuildSelector}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    role="combobox"
                                    aria-expanded={openGuildSelector}
                                    aria-label="Select an organization"
                                    className={cn("w-max gap-2 justify-between flex ")}>
                                    <div className="flex items-center justify-center py-2 gap-4">
                                        <Avatar className=" h-8 w-8">
                                            <AvatarImage
                                                src={getGuilds.data.find((guild) => guild.id === params.guildId)?.image ?? ""}
                                                alt={"image"} />
                                            <AvatarFallback>{getGuilds.data.find((guild) => guild.id === params.guildId)?.name?.slice(0, 2).toUpperCase().toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        {getGuilds.data.find((guild) => guild.id === params.guildId)?.name ?? "Organización"}
                                    </div>
                                    {!params?.eventId && <CaretDownIcon className="ml-auto h-5 w-5 shrink-0 opacity-50" />}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[15rem] ml-50 p-0">
                                <Command>
                                    <CommandList>
                                        <CommandInput placeholder="Buscar organización" />
                                        <CommandEmpty>No perteneces a una organización.</CommandEmpty>
                                        <CommandGroup heading={"Organizaciones"}>
                                            {getGuilds.data && getGuilds.data.map((it) => (
                                                <CommandItem
                                                    key={it.id}
                                                    onSelect={() => {
                                                        setOpenGuildSelector(false)
                                                        if (it.role === "EMPLOYEE") {
                                                            router.push(`/v1/${it.id}/cashier`)
                                                        } else {
                                                            router.push(`/v1/${it.id}`)
                                                        }
                                                    }}
                                                    className="text-sm flex justify-center items-center gap-2">
                                                    <Avatar className="mr-2 h-8 w-8">
                                                        <AvatarImage
                                                            src={it.image ?? undefined}
                                                            alt={ItemIndicator.name} />
                                                        <AvatarFallback>{it.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    {it.name}
                                                    <CheckIcon
                                                        className={cn(
                                                            "ml-auto h-6 w-6",
                                                            params?.guildId === it.id
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )} />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                    <CommandSeparator />
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                }
                <div>
                    <h1 className="w-max">
                        Version beta 23/02/2024
                    </h1>
                </div>
                {options?.menu &&
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full border-3 border-red-200">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage style={{ objectFit: "cover" }} src={session?.user?.image!} alt="profile-image" />
                                    <AvatarFallback>{session?.user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                {getInvites.data.length > 0 && <Badge variant={"destructive"} className="absolute top-5 left-5 rounded-full px-2 text-md" >{getInvites.data.length}</Badge>}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-max px-2" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-2">
                                    <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {session?.user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <Link href={"/account/invites"}>
                                    <DropdownMenuItem className="flex items-center gap-2">
                                        Invitaciones
                                        {getInvites.data.length > 0 && <Badge variant={"destructive"} className="" >{getInvites.data.length}</Badge>}
                                    </DropdownMenuItem>
                                </Link>
                                {/* <DropdownMenuItem>
                                    <Link href={"/account/settings"}>
                                        Ajustes de cuenta
                                    </Link>
                                </DropdownMenuItem> */}
                                <DropdownMenuItem>
                                    Ayuda
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            {/* <DropdownMenuSeparator /> */}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={onSignOut}>
                                Cerrar sesión
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                }
            </div>
            {options?.nav &&
                <div className="flex items-center w-full py-2">
                    <NavigationMenu>
                        {!params?.eventId ?
                            getGuilds.data.find((guild) => guild.id === params.guildId)?.role === "EMPLOYEE" ?
                                <NavigationMenuList>
                                    <NavigationMenuItem>
                                        <Link href={`/v1/${params?.guildId}/cashier`} legacyBehavior passHref>
                                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                                Inicio
                                            </NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                </NavigationMenuList>
                                :
                                <NavigationMenuList>
                                    <NavigationMenuItem>
                                        <Link href={`/v1/${params?.guildId}`} legacyBehavior passHref>
                                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                                Inicio
                                            </NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <Link href={`/v1/${params?.guildId}/events`} legacyBehavior passHref>
                                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                                Eventos
                                            </NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <Link href={`/v1/${params?.guildId}/sales`} legacyBehavior passHref>
                                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                                Ventas de la organización
                                            </NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <Link href={`/v1/${params?.guildId}/employees`} legacyBehavior passHref>
                                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                                Empleados
                                            </NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <Link href={`/v1/${params?.guildId}/settings`} legacyBehavior passHref>
                                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                                Ajustes
                                            </NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                </NavigationMenuList>
                            :
                            <NavigationMenuList>
                                <NavigationMenuItem>
                                    <Link href={`/v1/${params?.guildId}/events/${params?.eventId}`} legacyBehavior passHref>
                                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                            Resumen del evento
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <Link href={`/v1/${params?.guildId}/events/${params?.eventId}/employees`} legacyBehavior passHref>
                                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                            Empleados
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <Link href={`/v1/${params?.guildId}/events/${params?.eventId}/products`} legacyBehavior passHref>
                                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                            Productos
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <Link href={`/v1/${params?.guildId}/events/${params?.eventId}/deals`} legacyBehavior passHref>
                                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                            Promociones
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <Link href={`/v1/${params?.guildId}/events/${params?.eventId}/deposits`} legacyBehavior passHref>
                                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                            Depositos
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <Link href={`/v1/${params?.guildId}/events/${params?.eventId}/sales`} legacyBehavior passHref>
                                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                            Ventas del evento
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <Link href={`/v1/${params?.guildId}/events/${params?.eventId}/posts`} legacyBehavior passHref>
                                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                            Posteos
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <Link href={`/v1/${params?.guildId}/events/${params?.eventId}/users`} legacyBehavior passHref>
                                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                            Usuarios en este evento
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        }
                    </NavigationMenu>
                </div>
            }
        </div>
    );
}