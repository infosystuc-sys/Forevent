import Post from "~/app/_components/admin/post"
import { api } from "~/trpc/server"

const PostsDashboard = async ({ params }: { params: { eventId: string } }) => {
  const posts = await api.web.post.all({ eventId: params.eventId })

  if (posts.length < 1) {
    return (
      <div className="container flex items-center justify-center flex-col">
        <h1 className="text-3xl font-bold tracking-wide">No hay posteos en este evento</h1>
        <p className="text-muted-foreground">Aún no se han publicado posteos en este evento</p>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Todas las publicaciones</h2>
        <p className="text-muted-foreground">
          De este evento
        </p>
      </div>
      <div className="my-3 flex flex-col items-center">
        {
          posts.map((post, index) => {
            return (
              <Post key={index.toString()} post={post} />
            )
          })
        }
      </div>

    </div>
  )
}

export default PostsDashboard