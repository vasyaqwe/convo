import { MessageForm } from "@/components/forms/message-form"
import { UserAvatar } from "@/components/ui/user-avatar"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { User } from "@prisma/client"
import { notFound } from "next/navigation"

type PageProps = {
    params: {
        chatId: string
    }
}

export default async function Page({ params: { chatId } }: PageProps) {
    const session = await getAuthSession()

    const chat = await db.chat.findFirst({
        where: { id: chatId },
        include: {
            users: true,
        },
        orderBy: {
            createdAt: "asc",
        },
    })

    if (!chat) notFound()

    const chatParticipant = chat.users.find(
        (u) => u.id !== session?.user.id
    ) as User
    // casting because I know better

    return (
        <div className="flex-1 bg-accent">
            <header className="flex items-center gap-3 border-b border-secondary/75 p-4 ">
                <UserAvatar user={chatParticipant} />
                <p>{chatParticipant.name}</p>
            </header>
            <MessageForm chatId={chatId} />
        </div>
    )
}
