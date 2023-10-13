import PusherServer from "pusher"
import PusherClient from "pusher-js"

declare global {
    var cachedPusherClient: PusherClient | undefined
    var cachedPusherServer: PusherServer | undefined
}

let _pusherClient: PusherClient | undefined
let _pusherServer: PusherServer | undefined

if (process.env.NODE_ENV === "production") {
    _pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
        channelAuthorization: {
            endpoint: "/api/pusher/auth",
            transport: "ajax",
        },
        cluster: "eu",
    })

    _pusherServer = new PusherServer({
        appId: process.env.PUSHER_APP_ID!,
        key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
        secret: process.env.PUSHER_SECRET!,
        cluster: "eu",
        useTLS: true,
    })
} else {
    if (!global.cachedPusherClient || !global.cachedPusherServer) {
        global.cachedPusherClient = new PusherClient(
            process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
            {
                channelAuthorization: {
                    endpoint: "/api/pusher/auth",
                    transport: "ajax",
                },
                cluster: "eu",
            }
        )

        global.cachedPusherServer = new PusherServer({
            appId: process.env.PUSHER_APP_ID!,
            key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
            secret: process.env.PUSHER_SECRET!,
            cluster: "eu",
            useTLS: true,
        })
    }

    _pusherClient = global.cachedPusherClient
    _pusherServer = global.cachedPusherServer
}

export const pusherClient = _pusherClient
export const pusherServer = _pusherServer
