"use client"

import type { RouterOutputs } from "@forevent/api";
import { CaretDownIcon, CheckIcon } from "@radix-ui/react-icons";
import {
    Banknote,
    CalendarDays,
    ChevronsUpDown,
    HelpCircle,
    LayoutDashboard,
    LogOut,
    Mail,
    Menu,
    Moon,
    Settings,
    Sun,
    Users,
    Wallet,
} from "lucide-react";
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
} from "~/app/_components/ui/command";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/app/_components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/app/_components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "~/app/_components/ui/sheet";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { handleSignOut } from "../auth/auth-action";
import { Badge } from "../ui/badge";

type Guilds = Awaited<RouterOutputs["web"]["guild"]["getGuilds"]>;
type Invites = Awaited<RouterOutputs["web"]["userOnGuild"]["getInvites"]>;

/** Ítems de nivel organización. El nivel evento vive en sus propias tabs. */
function navItemsFor(guildId: string | undefined, role: string | undefined) {
    if (role === "EMPLOYEE") {
        return [
            { href: `/v1/${guildId}/cashier`, label: "Caja", icon: Wallet },
        ];
    }
    return [
        { href: `/v1/${guildId}`, label: "Inicio", icon: LayoutDashboard, exact: true },
        { href: `/v1/${guildId}/events`, label: "Eventos", icon: CalendarDays },
        { href: `/v1/${guildId}/sales`, label: "Ventas", icon: Banknote },
        { href: `/v1/${guildId}/employees`, label: "Empleados", icon: Users },
        { href: `/v1/${guildId}/cashier`, label: "Caja", icon: Wallet, separated: true },
        { href: `/v1/${guildId}/settings`, label: "Ajustes", icon: Settings },
    ];
}

export default function AdminSidebar({
    session,
    guilds,
    invites,
}: {
    session: Session | null;
    guilds: Guilds;
    invites: Invites;
}) {
    const router = useRouter();
    const params = useParams();
    const path = usePathname();
    const [openGuildSelector, setOpenGuildSelector] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const getGuilds = api.web.guild.getGuilds.useQuery(
        { email: session?.user.email! as string },
        { initialData: guilds, staleTime: 5 * 60_000 },
    );
    const getInvites = api.web.userOnGuild.getInvites.useQuery(
        { email: session?.user.email! as string },
        { initialData: invites, staleTime: 5 * 60_000 },
    );

    // Redirección inicial según rol — se conserva el comportamiento previo del navbar.
    React.useEffect(() => {
        if (getGuilds.data.length > 0 && !params?.guildId) {
            const role = getGuilds.data[0]?.role;
            if (role === "OWNER" || role === "MANAGER") {
                router.push(`/v1/${getGuilds.data[0]?.id}`);
            } else if (role === "EMPLOYEE") {
                router.push(`/v1/${getGuilds.data[0]?.id}/cashier`);
            } else {
                router.push("/unauthorized");
            }
        } else if (getGuilds.data.length > 0 && params?.guildId) {
            const role = getGuilds.data[0]?.role;
            if (role !== "OWNER" && role !== "MANAGER" && role !== "EMPLOYEE") {
                router.push("/unauthorized");
            }
        }
    }, []);

    const guildId = params?.guildId as string | undefined;
    const activeGuild = getGuilds.data.find((g) => g.id === guildId);
    const items = navItemsFor(guildId, activeGuild?.role);

    const content = (
        <div className="flex h-full flex-col">
            <GuildSelector
                guilds={getGuilds.data}
                activeGuild={activeGuild}
                open={openGuildSelector}
                setOpen={setOpenGuildSelector}
                onSelect={(g) => {
                    setOpenGuildSelector(false);
                    setMobileOpen(false);
                    router.push(g.role === "EMPLOYEE" ? `/v1/${g.id}/cashier` : `/v1/${g.id}`);
                }}
            />

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                {items.map((item) => {
                    const active = item.exact ? path === item.href : path?.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <React.Fragment key={item.href + item.label}>
                            {item.separated && <div className="my-2 border-t" />}
                            <Link
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    active
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                )}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                {item.label}
                            </Link>
                        </React.Fragment>
                    );
                })}
            </nav>

            <UserMenu session={session} invites={getInvites.data} />
        </div>
    );

    return (
        <>
            {/* Barra superior — solo móvil */}
            <div className="flex items-center gap-3 border-b px-4 py-3 md:hidden">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Abrir menú">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0">
                        {content}
                    </SheetContent>
                </Sheet>
                <span className="text-sm font-semibold">
                    {activeGuild?.name ?? "Forevent"}
                </span>
            </div>

            {/* Sidebar fijo — escritorio */}
            <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
                {content}
            </aside>
        </>
    );
}

function GuildSelector({
    guilds,
    activeGuild,
    open,
    setOpen,
    onSelect,
}: {
    guilds: Guilds;
    activeGuild: Guilds[number] | undefined;
    open: boolean;
    setOpen: (v: boolean) => void;
    onSelect: (g: Guilds[number]) => void;
}) {
    return (
        <div className="border-b p-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        role="combobox"
                        aria-expanded={open}
                        aria-label="Seleccionar organización"
                        className="h-auto w-full justify-between gap-2 px-2 py-2"
                    >
                        <span className="flex min-w-0 items-center gap-2">
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={activeGuild?.image ?? ""} alt="" />
                                <AvatarFallback>
                                    {activeGuild?.name?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-sm font-medium">
                                {activeGuild?.name ?? "Organización"}
                            </span>
                        </span>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-0" align="start">
                    <Command>
                        <CommandList>
                            <CommandInput placeholder="Buscar organización" />
                            <CommandEmpty>No perteneces a una organización.</CommandEmpty>
                            <CommandGroup heading="Organizaciones">
                                {guilds.map((it) => (
                                    <CommandItem
                                        key={it.id}
                                        onSelect={() => onSelect(it)}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <Avatar className="h-7 w-7">
                                            <AvatarImage src={it.image ?? undefined} alt="" />
                                            <AvatarFallback>
                                                {it.name.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="truncate">{it.name}</span>
                                        <CheckIcon
                                            className={cn(
                                                "ml-auto h-5 w-5",
                                                activeGuild?.id === it.id ? "opacity-100" : "opacity-0",
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

function UserMenu({
    session,
    invites,
}: {
    session: Session | null;
    invites: Invites;
}) {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    return (
        <div className="flex items-center gap-2 border-t p-3">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-auto flex-1 justify-start gap-2 px-2 py-2">
                        <span className="relative">
                            <Avatar className="h-8 w-8">
                                <AvatarImage
                                    style={{ objectFit: "cover" }}
                                    src={session?.user?.image!}
                                    alt=""
                                />
                                <AvatarFallback>
                                    {session?.user?.name?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {invites.length > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
                                >
                                    {invites.length}
                                </Badge>
                            )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
                            {session?.user?.name}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" side="top" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {session?.user?.name}
                            </p>
                            <p className="truncate text-xs leading-none text-muted-foreground">
                                {session?.user?.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/account/invites">
                        <DropdownMenuItem className="gap-2">
                            <Mail className="h-4 w-4" />
                            Invitaciones
                            {invites.length > 0 && (
                                <Badge variant="destructive" className="ml-auto">
                                    {invites.length}
                                </Badge>
                            )}
                        </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem className="gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Ayuda
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2" onSelect={() => handleSignOut()}>
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button
                variant="ghost"
                size="icon"
                aria-label="Cambiar tema"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
                {/* Sin montar aún no sabemos el tema: evita el parpadeo de icono en hidratación */}
                {mounted && theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                ) : (
                    <Moon className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
}
