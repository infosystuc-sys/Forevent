'use client'
import type { ArrayElement, RouterOutputs } from "@forevent/api"
import { Trash2 } from "lucide-react"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "~/app/_components/ui/avatar"
import { Button } from "~/app/_components/ui/button"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "~/app/_components/ui/carousel"
import { Separator } from "~/app/_components/ui/separator"
import { customdayjs } from "~/lib/constants"

const Post = ({ post }: { post: ArrayElement<Awaited<RouterOutputs["web"]["post"]["all"]>> }) => {
    return (
        <section className="max-w-[500px]">
            <header className="flex items-center gap-4 py-5 px-3">
                <div className="w-min">
                    <Avatar className="h-12 w-12">
                        <AvatarImage
                            src={post.userOnEvent.user.image ?? ""}
                            alt={`${post.userOnEvent.user.name}-image`}
                            className="object-cover"
                        />
                        <AvatarFallback className="text-lg bg-neutral-900">{post.userOnEvent.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </div>
                <h4 className="text-md tracking-wide">{post.userOnEvent.user.name}</h4>
            </header>
            <Separator />
            <main>
                <Carousel>
                    <CarouselContent>
                        {
                            post.pictures.map((picture) => {
                                return (
                                    <CarouselItem className="w-full" key={`picture-${picture.id}`}>
                                        <Image src={picture.url} alt={picture.id} width={500} height={500} className="object-cover" />
                                    </CarouselItem>
                                )
                            })
                        }
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </main>
            <Separator />
            <footer className="p-4 w-full">
                <h5 className="text-md font-bold tracking-wide mb-1">{post.likes} Me gusta</h5>
                <h6 className="inline">{post.userOnEvent.user.name}</h6>
                <p className="inline font-light ms-2 text-break text-muted-foreground">{post.about}</p>
            </footer>
            <Separator className="my-4" />
            <div className="flex gap-2 flex-col justify-center">
                <small className="block font-semibold text-muted">Publicado {customdayjs(post.createdAt).format('LLLL')}</small>
                <Button variant="destructive" onClick={() => { }}>
                    <Trash2 className="me-4" />
                    Eliminar publicación
                </Button>
            </div>
        </section>
    )
}

export default Post