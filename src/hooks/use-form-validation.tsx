import { useEffect, useState } from "react"
import { ZodIssueBase } from "zod"
import * as z from "zod"

type Errors<T> = Record<keyof T, string>

export const useFormValidation = <TFormData,>({
    onSubmit,
    formData,
    zodSchema,
}: {
    onSubmit: () => void
    formData: TFormData
    zodSchema: z.Schema<TFormData>
}) => {
    const [errors, setErrors] = useState<Errors<TFormData> | {}>({})
    const [showErrors, setShowErrors] = useState(false)

    const validate = () => {
        const res = zodSchema.safeParse(formData)
        if (!res.success) {
            const errorsArr = JSON.parse(res.error.message)

            const errorsObject = errorsArr.reduce(
                (result: Record<string, string>, e: ZodIssueBase) => {
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
