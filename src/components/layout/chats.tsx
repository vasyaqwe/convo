import { ActiveUsers } from "@/components/active-users"
import { ChatsList } from "@/components/chats-list"
import { USERS_SELECT } from "@/config"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = true

export async function Chats({
    className,
    ...props
}: React.ComponentProps<"aside">) {
    const session = await getAuthSession()

    const existingChats = session
        ? await db.chat.findMany({
              where: {
                  userIds: {
                      has: session.user.id,
                  },
              },
              orderBy: {
                  createdAt: "desc",
              },
              include: {
                  users: {
                      select: USERS_SELECT,
                  },
                  messages: {
                      include: {
                          seenBy: {
                              select: USERS_SELECT,
                          },
                          sender: {
                              select: USERS_SELECT,
                          },
                      },
                  },
              },
          })
        : []

    return (
        <aside
            className={cn(
                "sticky left-0 top-0 flex h-screen flex-col border-r border-secondary bg-accent pb-5  md:w-[var(--chats-width)]",
                className
            )}
            {...props}
        >
            <header className="flex h-[var(--header-height)] items-center border-b border-secondary px-4 ">
                <h2 className="text-3xl font-semibold">Chats</h2>
            </header>
            <ChatsList
                existingChats={existingChats}
                session={session}
            />
            <ActiveUsers />
        </aside>
    )
}
