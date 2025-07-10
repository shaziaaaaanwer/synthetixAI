"use server"

import { queryDataset } from "@/ai/flows/query-dataset"
import { z } from "zod"

const querySchema = z.object({
  dataset: z.string().min(10, "Dataset must be at least 10 characters long."),
  query: z.string().min(5, "Question must be at least 5 characters long."),
})

const MAX_DATASET_SIZE_FOR_QUERY = 20000;

export async function queryDatasetAction(prevState: any, formData: FormData) {
  const validatedFields = querySchema.safeParse({
    dataset: formData.get("dataset"),
    query: formData.get("query"),
  })

  if (!validatedFields.success) {
    return {
      message: "Invalid input. Please provide a valid dataset and question.",
      data: null,
      error: true,
    }
  }

  let datasetToQuery = validatedFields.data.dataset;
  if (datasetToQuery.length > MAX_DATASET_SIZE_FOR_QUERY) {
    datasetToQuery = datasetToQuery.substring(0, MAX_DATASET_SIZE_FOR_QUERY);
  }

  try {
    const result = await queryDataset({
      dataset: datasetToQuery,
      query: validatedFields.data.query,
    })
    return {
      message: "success",
      data: result.answer,
      error: false,
    }
  } catch (error: any) {
    console.error(error)
    return {
      message: error.message || "An unexpected error occurred while querying the dataset. The AI may have had trouble understanding the format or the question.",
      data: null,
      error: true,
    }
  }
}
