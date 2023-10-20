"use client"

import { Button } from "@/components/ui/button"
import { FileButton } from "@/components/ui/file-button"
import { Icons } from "@/components/ui/icons"
import { Loading } from "@/components/ui/loading"
import { TextArea } from "@/components/ui/textarea"
import { axiosInstance } from "@/config"
import { useUploadThing } from "@/lib/uploadthing"
import { cn } from "@/lib/utils"
import { MessagePayload } from "@/lib/validations/message"
import { ExtendedMessage } from "@/types"
import {
    InfiniteData,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"

type UserSettingsFormProps = React.ComponentProps<"form">

const IMAGE_SIZE = 100
const IMAGE_MARGIN = 12

export function UserSettingsForm({
    className,
    ...props
}: UserSettingsFormProps) {
    const [body, setBody] = useState("")
    const [image, setImage] = useState<string | undefined>(undefined)
    const { startUpload, isUploading } = useUploadThing("imageUploader")

    const queryClient = useQueryClient()
    const router = useRouter()

    const { mutate } = useMutation(
        async ({ body, image }: Omit<MessagePayload, "chatId">) => {
            const payload = {
                body,
                image,
            }

            const { data } = await axiosInstance.post("/message", payload)

            return data
        },
        {
            onMutate: () => {
                setBody("")
                setImage(undefined)
                document.documentElement.style.setProperty(
                    "--message-form-image-height",
                    `0px`
                )
            },
            onSuccess: () => {
                queryClient.invalidateQueries(["messages"])

                const data = queryClient.getQueryData<
                    InfiniteData<ExtendedMessage>
                >(["messages"])

                //if first message
                if (data?.pages.flatMap((page) => page).length === 1 || !data) {
                    router.refresh()
                }
            },
        }
    )

    function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            if (body.length > 0) {
                mutate({ body })
            }
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

    return (
        <form
            className={cn(className)}
            onSubmit={(e) => {
                e.preventDefault()
                mutate({ body, image })
            }}
            {...props}
        >
            {image && (
                <div className="group relative w-fit">
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
                            marginBlock: `${IMAGE_MARGIN}px`,
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
