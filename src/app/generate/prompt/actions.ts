"use server"

import { generateDatasetFromPrompt } from "@/ai/flows/generate-dataset-from-prompt"
import { enhancePrompt } from "@/ai/flows/enhance-prompt"
import { z } from "zod"

const promptSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters long."),
})

export async function generateDatasetAction(prevState: any, formData: FormData) {
  const validatedFields = promptSchema.safeParse({
    prompt: formData.get("prompt"),
  })

  if (!validatedFields.success) {
    return {
      message: "Invalid prompt. Please provide a more detailed description.",
      data: null,
      error: true,
    }
  }

  try {
    const result = await generateDatasetFromPrompt({
      prompt: validatedFields.data.prompt,
    })

    // Defensively check if the AI returned something and it's valid JSON
    if (!result || !result.dataset) {
      return {
        message: "The AI did not return any data. Please try enhancing your prompt or be more specific.",
        data: null,
        error: true,
      };
    }
    
    try {
      JSON.parse(result.dataset);
    } catch(e) {
      return {
        message: "The AI returned invalid data that could not be parsed. Please try again.",
        data: null,
        error: true,
      }
    }

    return {
      message: "success",
      data: result.dataset,
      error: false,
    }
  } catch (error) {
    console.error(error)
    return {
      message: "An unexpected error occurred. Please try again.",
      data: null,
      error: true,
    }
  }
}

const enhancePromptSchema = z.object({
  prompt: z.string().min(3, "Prompt must be at least 3 characters long."),
})

export async function enhancePromptAction(formData: FormData) {
  const validatedFields = enhancePromptSchema.safeParse({
    prompt: formData.get("prompt"),
  })

  if (!validatedFields.success) {
    return {
      error: "Prompt is too short to enhance.",
    }
  }

  try {
    const result = await enhancePrompt({ prompt: validatedFields.data.prompt })
    return { data: result.enhancedPrompt }
  } catch (error) {
    console.error(error)
    return {
      error: "AI enhancement failed. Please try again.",
    }
  }
}
