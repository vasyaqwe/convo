"use client"

import { Button } from "@/components/ui/button"
import { FileButton } from "@/components/ui/file-button"
import { Icons } from "@/components/ui/icons"
import { Loading } from "@/components/ui/loading"
import { Skeleton } from "@/components/ui/skeleton"
import { TextArea } from "@/components/ui/textarea"
import { axiosInstance } from "@/config"
import { useDebounce } from "@/hooks/use-debounce"
import { useUploadThing } from "@/lib/uploadthing"
import { cn, isRecent } from "@/lib/utils"
import { type MessagePayload } from "@/lib/validations/message"
import {
    messagesQueryKey,
    useMessageHelpersStore,
} from "@/stores/use-message-helpers-store.tsx"
import { type ExtendedMessage } from "@/types"
import {
    type InfiniteData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query"
import { nanoid } from "nanoid"
import { type Session } from "next-auth"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

type MessageFormProps = {
    chatId: string
    session: Session | null
}

const IMAGE_SIZE = 100
const IMAGE_MARGIN = 12

export function MessageForm({ chatId, session }: MessageFormProps) {
    const [body, setBody] = useState("")
    const { debouncedValue: debouncedBody } = useDebounce<string>({
        value: body,
        delay: 1500,
    })

    const [startedTyping, setStartedTyping] = useState(false)

    const [image, setImage] = useState<string | undefined>(undefined)
    const { startUpload, isUploading } = useUploadThing("imageUploader")

    const messageBodyRef = useRef<HTMLTextAreaElement | null>(null)

    const queryClient = useQueryClient()
    const router = useRouter()
    const { replyTo, isReplying, setIsReplying } = useMessageHelpersStore()

    const { refetch: refetchStartTyping } = useQuery({
        queryKey: ["chat-start-typing"],
        queryFn: async () => {
            await axiosInstance.patch(`/chat/${chatId}/start-typing`)

            return "OK"
        },
        enabled: false,
    })

    const { refetch: refetchEndTyping } = useQuery({
        queryKey: ["chat-end-typing"],
        queryFn: async () => {
            await axiosInstance.patch(`/chat/${chatId}/end-typing`)

            return "OK"
        },
        enabled: false,
    })

    const { mutate, isPending } = useMutation({
        mutationFn: async ({
            body,
            image,
            isReplying,
        }: Omit<MessagePayload, "chatId"> & { isReplying: boolean }) => {
            const payload: MessagePayload = {
                chatId,
                body,
                image,
                replyToId: isReplying ? replyTo?.id : undefined,
            }

            await axiosInstance.post("/message", payload)

            return "OK"
        },
        onMutate: async (sentMessage) => {
            await queryClient.cancelQueries({
                queryKey: messagesQueryKey,
            })

            const prevData = queryClient.getQueryData<
                InfiniteData<ExtendedMessage[]>
            >(messagesQueryKey) ?? { pageParams: [1], pages: [[]] }

            if (session?.user) {
                const messages = prevData.pages.flat()
                const lastMessage = messages[messages.length - 1]
                const prevTimestamp = new Date(
                    lastMessage?.createdAt ?? new Date()
                ).getTime()
                const currentTimestamp = new Date().getTime()
                const timeDiff = currentTimestamp - prevTimestamp

                const currentTime = new Date().toISOString() as unknown as Date

                queryClient.setQueryData<InfiniteData<ExtendedMessage[]>>(
                    messagesQueryKey,
                    {
                        ...prevData,
                        pages: prevData.pages.map((page, idx, arr) =>
                            idx === arr.length - 1
                                ? [
                                      ...page,
                                      {
                                          body: sentMessage.body ?? null,
                                          chatId,
                                          id: nanoid(),
                                          image: sentMessage.image ?? null,
                                          sender: {
                                              id: session?.user.id,
                                              image: session.user.image ?? null,
                                              name: session.user.name,
                                              username:
                                                  session.user.username ?? "",
                                          },
                                          displaySender:
                                              messages.length === 0
                                                  ? true
                                                  : !isRecent(timeDiff) ||
                                                    lastMessage?.senderId !==
                                                        session.user.id,
                                          seenBy: [],
                                          seenByIds: [],
                                          senderId: session.user.id,
                                          createdAt: currentTime,
                                          updatedAt: currentTime,
                                          replyTo:
                                              isReplying && replyTo
                                                  ? replyTo
                                                  : null,
                                          replyToId:
                                              isReplying && replyTo
                                                  ? replyTo.id
                                                  : null,
                                      },
                                  ]
                                : page
                        ),
                    }
                )
            }

            setTimeout(() => {
                document
                    .querySelector(".chat-wrapper")
                    ?.lastElementChild?.scrollIntoView({ behavior: "smooth" })
            }, 0)

            setBody("")
            setImage(undefined)
            setIsReplying(false)
            refetchEndTyping()

            document.documentElement.style.setProperty(
                "--message-form-image-height",
                `0px`
            )

            return { prevData, sentMessage }
        },
        onError: (_err, _newData, context) => {
            queryClient.setQueryData(messagesQueryKey, context?.prevData)
            return toast.error("Something went wrong")
        },
        onSettled: () => {
            router.refresh()
            queryClient.invalidateQueries({ queryKey: ["users-search"] })
            queryClient.invalidateQueries({
                queryKey: messagesQueryKey,
            })
        },
    })

    useEffect(() => {
        return () => {
            refetchEndTyping()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        setTimeout(() => {
            messageBodyRef?.current?.focus()
        }, 0)
    }, [replyTo])

    useEffect(() => {
        if (debouncedBody.length === 0) return

        refetchEndTyping()
        setStartedTyping(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedBody])

    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Backspace") {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() => {
                refetchEndTyping()
                setStartedTyping(false)
            }, 1500)
        }

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !isUploading &&
                !isPending &&
                (body.length > 0 || image)
            ) {
                mutate({ body, image, isReplying })
            }
        }
    }

    function onBodyChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        setBody(e.target.value)
        if (!startedTyping) {
            refetchStartTyping()
        }
        setStartedTyping(true)
    }

    async function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files?.[0]) {
            const uploadedImage = await startUpload([e.target.files[0]])

            if (uploadedImage) {
                setImage(uploadedImage[0]?.url)

                document.documentElement.style.setProperty(
                    "--message-form-image-height",
                    `${IMAGE_SIZE + IMAGE_MARGIN * 2}px`
                )
            }
        }
    }

    async function onImagePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
        if (e.clipboardData.files?.[0]) {
            const uploadedImage = await startUpload([
                e.clipboardData.files?.[0],
            ])

            if (uploadedImage) {
                setImage(uploadedImage[0]?.url)

                document.documentElement.style.setProperty(
                    "--message-form-image-height",
                    `${IMAGE_SIZE + IMAGE_MARGIN * 2}px`
                )
            }
        }
    }

    return (
        <MessageFormShell>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    mutate({ body, image, isReplying })
                }}
            >
                <div className="flex h-[var(--message-form-height)] items-center ">
                    <FileButton
                        className="flex-shrink-0"
                        disabled={isUploading || !!image}
                        onChange={onImageChange}
                        accept="image/*"
                    >
                        {isUploading ? <Loading /> : <Icons.image />}
                        <span className="sr-only">Attach image</span>
                    </FileButton>
                    <TextArea
                        ref={messageBodyRef}
                        id="message-input"
                        maxLength={1000}
                        onPaste={onImagePaste}
                        onKeyDown={onKeyDown}
                        autoFocus
                        value={body}
                        onChange={onBodyChange}
                        placeholder="Type a message"
                        className="h-[var(--message-form-height)] w-full"
                    />

                    <Button
                        className="flex-shrink-0"
                        disabled={
                            (body.length < 1 && !image) ||
                            isUploading ||
                            isPending
                        }
                        variant={"ghost"}
                        size={"icon"}
                    >
                        <Icons.send />
                        <span className="sr-only">Send message</span>
                    </Button>
                </div>
                {image && (
                    <div
                        className="group relative w-fit rounded-lg border border-foreground/75"
                        style={{
                            marginBlock: `${IMAGE_MARGIN}px`,
                        }}
                    >
                        <Button
                            onClick={() => {
                                document.documentElement.style.setProperty(
                                    "--message-form-image-height",
                                    `0px`
                                )
                                setImage(undefined)
                            }}
                            size={"icon-sm"}
                            className="absolute -right-1 -top-3 hidden group-hover:flex"
                        >
                            <Icons.X
                                width={20}
                                height={20}
                            />
                        </Button>
                        <Image
                            style={{
                                height: `${IMAGE_SIZE}px`,
                            }}
                            className=" rounded-lg object-cover object-top"
                            src={image}
                            alt={body ?? ""}
                            width={IMAGE_SIZE}
                            height={IMAGE_SIZE}
                        />
                    </div>
                )}
            </form>
        </MessageFormShell>
    )
}

export function MessageFormSkeleton({
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <MessageFormShell {...props}>
            <div className="flex h-full w-full items-center justify-between gap-4">
                <Skeleton className="h-9 w-9 " />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="ml-auto h-9 w-9 " />
            </div>
        </MessageFormShell>
    )
}

function MessageFormShell({
    children,
    className,
    ...props
}: React.ComponentProps<"div">) {
    const { setIsReplying, isReplying, replyTo } = useMessageHelpersStore()

    return (
        <div
            className={cn(
                "h-[calc(var(--message-form-height)+var(--message-form-image-height)+var(--message-form-reply-height))] overflow-hidden border-t border-secondary px-4",
                className
            )}
            {...props}
        >
            {isReplying && (
                <div className="flex h-[var(--message-form-reply-height)] w-full items-center gap-3">
                    <Icons.reply className="flex-shrink-0 stroke-primary" />
                    <div>
                        <p className="font-medium">{replyTo?.sender.name}</p>
                        <p className="line-clamp-1 break-all text-sm">
                            {replyTo?.body}
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsReplying(false)}
                        size={"icon-sm"}
                        variant={"ghost"}
                        className="ml-auto flex-shrink-0"
                    >
                        <Icons.X />
                        <span className="sr-only">Close</span>
                    </Button>
                </div>
            )}
            {children}
        </div>
    )
}
