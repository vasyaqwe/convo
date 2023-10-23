"use client"

import { Button } from "@/components/ui/button"
import { ErrorMessage, Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loading } from "@/components/ui/loading"
import { UserAvatar } from "@/components/ui/user-avatar"
import { axiosInstance } from "@/config"
import { useFormValidation } from "@/hooks/use-form-validation"
import { useUploadThing } from "@/lib/uploadthing"
import { cn } from "@/lib/utils"
import { SettingsPayload, settingsSchema } from "@/lib/validations/settings"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { Session } from "next-auth"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

type UserSettingsFormProps = React.ComponentProps<"form"> & {
    session: Session
    closeDialog: () => void
}

export function UserSettingsForm({
    className,
    session,
    closeDialog,
    ...props
}: UserSettingsFormProps) {
    const [formData, setFormData] = useState<SettingsPayload>({
        name: session.user.name,
        username: session.user.username!,
        // username is not optional, a random nanoid is added manually in authOptions if it's not provided when signing up
        image: session.user.image,
    })

    const { startUpload, isUploading } = useUploadThing("imageUploader")

    const router = useRouter()
    const queryClient = useQueryClient()

    const { mutate: onSubmit, isPending } = useMutation({
        mutationFn: async () => {
            const { data } = await axiosInstance.patch("/settings", formData)

            return data
        },
        onSuccess: () => {
            router.refresh()
            closeDialog()
            toast.success("Settings saved")
            queryClient.invalidateQueries({ queryKey: ["messages"] })
        },
        onError: (err) => {
            if (err instanceof AxiosError) {
                if (err.response?.status === 409) {
                    return toast.error(
                        "This username is already taken by someone"
                    )
                }
            }

            return toast.error("Something went wrong")
        },
    })

    const { safeOnSubmit, errors } = useFormValidation({
        onSubmit: () => onSubmit(),
        formData,
        zodSchema: settingsSchema,
    })

    async function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            const uploadedImage = await startUpload([e.target.files[0]])

            if (uploadedImage) {
                setFormData((prev) => ({
                    ...prev,
                    image: uploadedImage[0]?.url,
                }))
            }
        }
    }

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    return (
        <form
            className={cn(className)}
            onSubmit={(e) => {
                e.preventDefault()
                safeOnSubmit()
            }}
            {...props}
        >
            <Label
                className="mt-8 inline-block"
                htmlFor="name"
            >
                Name
            </Label>
            <Input
                name="name"
                id="name"
                value={formData.name}
                onChange={onChange}
            />
            <ErrorMessage error={errors.name} />

            <Label
                className="mt-6 inline-block"
                htmlFor="username"
            >
                Username
            </Label>

            <div className="relative">
                <Input
                    type="text"
                    name="username"
                    value={formData.username ?? ""}
                    onChange={onChange}
                    id="username"
                    className="pl-7"
                />
                <span className="absolute left-3 top-[47%] -translate-y-1/2 text-sm text-muted-foreground">
                    @
                </span>
            </div>
            <ErrorMessage error={errors.username} />

            <Label
                className="mt-5 inline-block"
                htmlFor="image"
            >
                Image
            </Label>
            <div className="mt-2 flex items-center gap-4">
                <label
                    htmlFor="image"
                    className="relative"
                >
                    {isUploading && (
                        <div className="absolute inset-0 z-10 grid place-content-center bg-black/75">
                            <Loading />
                        </div>
                    )}
                    {formData.image ? (
                        <div className="relative h-[var(--avatar-size)] w-[var(--avatar-size)] flex-shrink-0">
                            <Image
                                className=" rounded-full object-cover object-top"
                                src={formData.image}
                                alt={formData.name}
                                fill
                            />
                        </div>
                    ) : (
                        <UserAvatar
                            showActiveIndicator={false}
                            user={session.user}
                        />
                    )}
                </label>
                <Input
                    id={"image"}
                    disabled={isUploading}
                    type="file"
                    onChange={onImageChange}
                />
            </div>

            <Button
                className="mt-9 w-full"
                disabled={isPending}
            >
                {isPending ? <Loading /> : "Save"}
            </Button>
        </form>
    )
}
