import Image from 'next/image'
import { customdayjs } from '~/lib/constants'

function Smallcard({ data }: {
    data: {
        author: {
            image: string,
            name: string
        },
        title: string,
        tags: string[],
        createdAt: Date
    }
}) {
    let { author, title, tags, createdAt } = data
    return (
        <div className="basis-2/5 text-gray-700 shadow-md w-full rounded-xl bg-clip-border transition-all hover:scale-105 focus:scale-105 focus:opacity-[0.85] active:scale-100 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none space-y-2">
            <div className="relative my-4 overflow-hidden text-gray-700 h-72 rounded-xl bg-clip-border">
                <Image
                    src="https://cdn.discordapp.com/attachments/1159824015414792234/1180551902421864499/photo-1624555130581-1d9cca783bc0.png?ex=657dd5a3&is=656b60a3&hm=5d0493ff5192919ffb289fffe09363cb1dfc8506880bc2f0a5f1218f43b84d8a&"
                    style={{ objectFit: "cover", objectPosition: "center" }}
                    alt="image"
                    width={500}
                    height={500}
                    className="object-cover w-full h-full"
                />
            </div>
            <div className="flex items-center gap-4">
                {tags.map((tag, index) => {
                    return (
                        <h3 key={index.toString()} className="block font-sans text-base antialiased font-medium leading-relaxed text-white">
                            {tag}
                        </h3>
                    )
                })}
            </div>
            <div className="flex items-center justify-between">
                <h2 className="block font-bold font-sans text-base antialiased leading-relaxed text-white">
                    {title}
                </h2>
            </div>
            <div className="flex items-center justify-between mb-2 gap-2">
                <Image
                    src={author.image}
                    style={{ objectFit: "cover", objectPosition: "center" }}
                    alt="image"
                    width={500}
                    height={500}
                    className="object-cover rounded-full w-6 h-6"
                />
                <h3 className='text-neutral-500'>
                    {author.name}
                </h3>
                <h3 className='text-neutral-500'>
                    •
                </h3>
                <h3 className='text-neutral-500'>
                    {customdayjs(createdAt).format("LL")}
                </h3>
            </div>
        </div>
    )
}

export default Smallcard