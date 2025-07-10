"use server"

import { getDataInsights } from "@/ai/flows/get-data-insights"
import { z } from "zod"

const analyzeSchema = z.object({
  dataset: z.string().min(10, "Dataset must be at least 10 characters long."),
})

const MAX_DATASET_SIZE_FOR_ANALYSIS = 20000;

export async function getInsightsAction(prevState: any, formData: FormData) {
  const validatedFields = analyzeSchema.safeParse({
    dataset: formData.get("dataset"),
  })

  if (!validatedFields.success) {
    return {
      message: "Invalid dataset. Please provide a more substantial dataset.",
      data: null,
      error: true,
    }
  }

  let datasetToAnalyze = validatedFields.data.dataset;
  if (datasetToAnalyze.length > MAX_DATASET_SIZE_FOR_ANALYSIS) {
    datasetToAnalyze = datasetToAnalyze.substring(0, MAX_DATASET_SIZE_FOR_ANALYSIS);
  }

  try {
    const result = await getDataInsights({
      dataset: datasetToAnalyze,
    })
    return {
      message: "success",
      data: result,
      error: false,
    }
  } catch (error: any) {
    console.error(error)
    return {
      message: error.message || "An unexpected error occurred during analysis. The AI may have had trouble understanding the format. Please check your data or try a smaller sample.",
      data: null,
      error: true,
    }
  }
}
