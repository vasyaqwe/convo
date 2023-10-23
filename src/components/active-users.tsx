"use client"

import { pusherClient } from "@/lib/pusher"
import { useActiveUsersStore } from "@/stores/use-active-users-store"
import { Channel, Members } from "pusher-js"
import { useEffect, useState } from "react"

export function ActiveUsers() {
    const { setMembers, addMember, removeMember } = useActiveUsersStore()
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null)

    useEffect(() => {
        let channel = activeChannel

        if (!channel) {
            channel = pusherClient.subscribe("presence-convo")
            setActiveChannel(channel)
        }

        channel.bind("pusher:subscription_succeeded", (members: Members) => {
            const initialMembers: string[] = []
            members.each((member: Record<string, any>) => {
                if (!initialMembers.includes(member.id))
                    initialMembers.push(member.id)
            })

            setMembers(initialMembers)
        })

        channel.bind("pusher:member_added", (member: Record<string, any>) => {
            addMember(member.id)
        })

        channel.bind("pusher:member_removed", (member: Record<string, any>) => {
            removeMember(member.id)
        })

        return () => {
            if (activeChannel) {
                pusherClient.unsubscribe("presence-convo")
                setActiveChannel(null)
            }
        }
    }, [activeChannel, addMember, removeMember, setMembers])

    return null
}
