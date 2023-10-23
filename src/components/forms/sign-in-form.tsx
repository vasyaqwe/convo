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
import { useFormValidation } from "@/hooks/use-form-validation"
import { SignInPayload, signInSchema } from "@/lib/validations/sign-in"
import { useRouter } from "next/navigation"

type SignInFormProps = React.ComponentProps<"div">

export function SignInForm({ className, ...rest }: SignInFormProps) {
    const router = useRouter()

    const [signInLoading, setSignInLoading] = useState(false)

    const { isPending, mutate: login } = useMutation({
        mutationFn: () => signIn("google"),
        onError: () => {
            toast.error("An unknown error occured")
        },
    })

    const [formData, setFormData] = useState<SignInPayload>({
        username: "",
        password: "",
    })

    async function onSubmit() {
        setSignInLoading(true)

        await signIn("credentials", {
            ...formData,
            redirect: false,
        })
            .then((cb) => {
                if (cb?.error) {
                    toast.error(cb.error)
                }
                if (cb?.ok) {
                    router.push("/")
                }
            })
            .finally(() => setSignInLoading(false))
    }

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const { safeOnSubmit, errors } = useFormValidation({
        onSubmit,
        formData,
        zodSchema: signInSchema,
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
                Sign in into your account
            </h1>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    safeOnSubmit()
                }}
                className="space-y-3"
            >
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
                    disabled={signInLoading}
                    className="!mt-5 w-full"
                >
                    {signInLoading ? <Loading /> : "Sign in"}
                </Button>
            </form>
            <Button
                disabled={isPending}
                className=" w-full bg-white text-black hover:bg-white/90"
                onClick={() => login()}
            >
                {!isPending && <Icons.google />}
                {isPending ? <Loading /> : "Sign in with Google"}
            </Button>
            <p className="!mt-6 text-center text-muted-foreground">
                Don't have an account yet?{" "}
                <Link
                    className="underline hover:no-underline"
                    href={"/sign-up"}
                >
                    Sign up
                </Link>
            </p>
        </div>
    )
}
