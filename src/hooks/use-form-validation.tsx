import { type UseMutateFunction } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import type { ZodIssue } from "zod"
import type { z } from "zod"

type Errors<T> = Record<keyof T, string>

export const useFormValidation = <TFormData,>({
    onSubmit,
    formData,
    zodSchema,
}: {
    onSubmit:
        | (() => Promise<void>)
        | UseMutateFunction<string, Error, void, unknown>
    formData: TFormData
    zodSchema: z.Schema<TFormData>
}) => {
    const [errors, setErrors] = useState<Errors<TFormData> | object>({})
    const [showErrors, setShowErrors] = useState(false)

    const validate = () => {
        const res = zodSchema.safeParse(formData)
        if (!res.success) {
            const errorsArr: ZodIssue[] = JSON.parse(res.error.message)

            const errorsObject = errorsArr.reduce(
                (result: Record<string, string>, e) => {
                    const key = e.path[0]
                    const message = e.message
                    if (message && key) {
                        result[key] = message
                    }
                    return result
                },
                {}
            )
            setErrors(errorsObject)
        } else {
            setErrors({})
        }
    }

    useEffect(validate, [formData, zodSchema])

    const safeOnSubmit = () => {
        const noErrors = Object.keys(errors).length < 1

        if (noErrors) {
            setShowErrors(false)
            onSubmit()
        } else {
            setShowErrors(true)
        }
    }

    return {
        errors: showErrors
            ? (errors as Errors<TFormData>)
            : ({} as Errors<TFormData>),
        safeOnSubmit,
    }
}
