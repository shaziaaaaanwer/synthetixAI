"use server"

import { smartColumnSuggestion } from "@/ai/flows/smart-column-suggestions"
import { generateStructuredData } from "@/ai/flows/generate-structured-data"
import { z } from "zod"

// Action for column suggestions
const suggestionSchema = z.object({
  columnName: z.string().min(1, "Column name is required."),
  columnDescription: z.string().optional(),
})

export async function suggestColumnTypeAction(formData: FormData) {
  const validatedFields = suggestionSchema.safeParse({
    columnName: formData.get("columnName"),
    columnDescription: formData.get("columnDescription"),
  })

  if (!validatedFields.success) {
    return {
      error: "Invalid input for column suggestion.",
    }
  }

  try {
    const result = await smartColumnSuggestion(validatedFields.data)
    return { data: result }
  } catch (error) {
    console.error(error)
    return {
      error: "AI suggestion failed. Please try again.",
    }
  }
}

// Action for generating the dataset
const generateSchema = z.object({
  columns: z.string().min(1, "At least one column is required."),
  count: z.coerce.number().int().min(1).max(100),
})

export async function generateStructuredDataAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = generateSchema.safeParse({
    columns: formData.get("columns"),
    count: formData.get("count"),
  })

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
      data: null,
    }
  }

  try {
    const columns = JSON.parse(validatedFields.data.columns)
    if (!Array.isArray(columns) || columns.length === 0) {
      return { message: "Invalid columns format.", data: null }
    }

    const result = await generateStructuredData({
      columns: columns,
      count: validatedFields.data.count,
    })

    return {
      message: "success",
      data: result.dataset,
    }
  } catch (error) {
    console.error(error)
    return {
      message: "An unexpected error occurred. Please try again.",
      data: null,
    }
  }
}
