import { ChatSkeleton } from "@/components/chat"
import { MessageFormSkeleton } from "@/components/forms/message-form"
import { ChatHeaderSkeleton } from "@/components/layout/chat-header"

export default function Loading() {
    return (
        <div className="flex flex-1 flex-col bg-accent">
            <ChatHeaderSkeleton />
            <ChatSkeleton />
            <MessageFormSkeleton />
        </div>
    )
}
