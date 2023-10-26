"use client"

import { Button } from "@/components/ui/button"
import { FileButton } from "@/components/ui/file-button"
import { Icons } from "@/components/ui/icons"
import { Loading } from "@/components/ui/loading"
import { TextArea } from "@/components/ui/textarea"
import { axiosInstance } from "@/config"
import { useUploadThing } from "@/lib/uploadthing"
import { MessagePayload } from "@/lib/validations/message"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner"

type MessageFormProps = {
    chatId: string
}

const IMAGE_SIZE = 100
const IMAGE_MARGIN = 12

export function MessageForm({ chatId }: MessageFormProps) {
    const [body, setBody] = useState("")
    const [image, setImage] = useState<string | undefined>(undefined)
    const { startUpload, isUploading } = useUploadThing("imageUploader")

    const queryClient = useQueryClient()

    const { mutate, isPending } = useMutation({
        mutationFn: async ({ body, image }: Omit<MessagePayload, "chatId">) => {
            const payload: MessagePayload = {
                chatId,
                body,
                image,
            }
            const { data } = await axiosInstance.post("/message", payload)

            return data
        },
        onMutate: () => {
            setBody("")
            setImage(undefined)
            document.documentElement.style.setProperty(
                "--message-form-image-height",
                `0px`
            )
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messages"] })
            queryClient.invalidateQueries({ queryKey: ["users-search"] })
        },
        onError: () => {
            return toast.error("Something went wrong")
        },
    })

    function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (
            e.key === "Enter" &&
            !e.shiftKey &&
            !isUploading &&
            !isPending &&
            (body.length > 0 || image)
        ) {
            e.preventDefault()
            mutate({ body, image })
        }
    }

    async function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
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
        if (e.clipboardData && e.clipboardData.files[0]) {
            const uploadedImage = await startUpload([e.clipboardData.files[0]])

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
        <form
            onSubmit={(e) => {
                e.preventDefault()
                mutate({ body, image })
            }}
            className="h-[calc(var(--message-form-height)+var(--message-form-image-height))] overflow-hidden border-t border-secondary px-4"
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
                    onPaste={onImagePaste}
                    onKeyDown={onKeyDown}
                    autoFocus
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type a message"
                    className="h-[var(--message-form-height)] w-full"
                />

                <Button
                    className="flex-shrink-0"
                    disabled={
                        (body.length < 1 && !image) || isUploading || isPending
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
    )
}
