"use client"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { useMutation } from "@tanstack/react-query"
import { signIn } from "next-auth/react"
import Link from "next/link"
import logo from "@public/logo.svg"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Loading } from "@/components/ui/loading"
import { ErrorMessage, Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { axiosInstance } from "@/config"
import { AxiosError } from "axios"
import { type SignUpPayload, signUpSchema } from "@/lib/validations/sign-up"
import { useFormValidation } from "@/hooks/use-form-validation"

type SignUpFormProps = React.ComponentProps<"div">

export function SignUpForm({ className, ...rest }: SignUpFormProps) {
    const { isPending, mutate: login } = useMutation({
        mutationFn: () => signIn("google", { callbackUrl: "/chats" }),
        onError: () => {
            toast.error("An unknown error occured")
        },
    })

    const [formData, setFormData] = useState<SignUpPayload>({
        username: "",
        name: "",
        password: "",
    })

    const { mutate: onSubmit, isPending: signUpLoading } = useMutation({
        mutationFn: async () => {
            const { data } = await axiosInstance.patch("/sign-up", formData)

            return data as string
        },
        onError: (error) => {
            if (error instanceof AxiosError) {
                return toast.error(error.response?.data)
            }

            toast.error("Something went wrong.")
        },
        onSuccess: () => {
            signIn("credentials", {
                username: formData.username,
                password: formData.password,
                callbackUrl: "/chats",
            })
        },
    })

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const { safeOnSubmit, errors } = useFormValidation({
        onSubmit,
        formData,
        zodSchema: signUpSchema,
    })

    return (
        <div
            className={cn("mx-auto w-full max-w-sm space-y-4", className)}
            {...rest}
        >
            <div className="mx-auto flex w-fit items-center justify-center gap-2">
                <Image
                    src={logo}
                    alt="Discusst"
                    className="mx-auto max-w-[40px]"
                />
                <p className="bg-gradient-to-r from-primary to-white bg-clip-text text-4xl font-semibold text-transparent">
                    {" "}
                    convo.
                </p>
            </div>
            <h1 className="text-center text-2xl font-semibold md:text-3xl">
                Create an account
            </h1>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    safeOnSubmit()
                }}
                className="space-y-3"
            >
                <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                        autoFocus
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={onChange}
                        id="name"
                        placeholder="Your name"
                    />
                    <ErrorMessage error={errors.name} />
                </div>
                <div>
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                        <Input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={onChange}
                            id="username"
                            className="pl-7"
                        />
                        <span className="absolute left-3 top-[47%] -translate-y-1/2 text-sm text-muted-foreground">
                            @
                        </span>
                    </div>
                    <ErrorMessage error={errors.username} />
                </div>
                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                        name="password"
                        value={formData.password}
                        onChange={onChange}
                        id="password"
                        type="password"
                        placeholder="Your password"
                    />
                    <ErrorMessage error={errors.password} />
                </div>
                <Button
                    disabled={signUpLoading}
                    className="!mt-5 w-full"
                >
                    {signUpLoading ? <Loading /> : "Sign up"}
                </Button>
            </form>
            <Button
                disabled={isPending}
                className=" w-full bg-white text-black hover:bg-white/90"
                onClick={() => login()}
            >
                {!isPending && <Icons.google />}
                {isPending ? <Loading /> : "Sign up with Google"}
            </Button>
            <p className="!mt-6 text-center text-muted-foreground">
                Already have an account?{" "}
                <Link
                    className="underline hover:no-underline"
                    href={"/sign-in"}
                >
                    Sign in
                </Link>
            </p>
        </div>
    )
}
