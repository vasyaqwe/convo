import { authOptions } from "@/lib/auth"
import { pusherServer } from "@/lib/pusher"
import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const session = await getServerSession(req, res, authOptions)

    if (!session) {
        return res.status(401)
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const socketId = req.body.socket_id
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const channel = req.body.channel_name
    const data = {
        user_id: session.user.id,
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channel, data)

    return res.send(authResponse)
}
