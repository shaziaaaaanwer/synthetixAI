"use server"

import { generateSyntheticText } from "@/ai/flows/synthetic-text-generator"
import { z } from "zod"

const textSchema = z.object({
  textType: z.string().min(1, "Text type is required."),
  topic: z.string().optional(),
  length: z.string().optional(),
  style: z.string().optional(),
  count: z.coerce.number().int().min(1).max(10),
})

export async function generateTextAction(prevState: any, formData: FormData) {
  const validatedFields = textSchema.safeParse({
    textType: formData.get("textType"),
    topic: formData.get("topic"),
    length: formData.get("length"),
    style: formData.get("style"),
    count: formData.get("count"),
  })

  if (!validatedFields.success) {
    return {
      message: "Invalid input. Please check the form fields.",
      data: null,
    }
  }

  try {
    const result = await generateSyntheticText(validatedFields.data)
    return {
      message: "success",
      data: result.texts,
    }
  } catch (error) {
    console.error(error)
    return {
      message: "An unexpected error occurred while generating text.",
      data: null,
    }
  }
}
