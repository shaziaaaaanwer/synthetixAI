"use server"

import { analyzeDataset } from "@/ai/flows/analyze-dataset"
import { enhanceDataset } from "@/ai/flows/enhance-dataset"
import { generateChartSuggestion } from "@/ai/flows/generate-chart-suggestion"
import { z } from "zod"

const analyzeSchema = z.object({
  dataset: z.string().min(10, "Dataset must be at least 10 characters long."),
})

const MAX_DATASET_SIZE_FOR_ANALYSIS = 20000;

export async function analyzeDatasetAction(prevState: any, formData: FormData) {
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
    const result = await analyzeDataset({
      dataset: datasetToAnalyze,
    })
    return {
      message: "success",
      data: result,
      error: false,
    }
  } catch (error) {
    console.error(error)
    return {
      message: "An unexpected error occurred during analysis. The AI may have had trouble understanding the format. Please check your data or try a smaller sample.",
      data: null,
      error: true,
    }
  }
}

const transformSchema = z.object({
  dataset: z.string().min(1, "Original dataset is missing."),
  instruction: z.string().min(1, "An instruction is required."),
});

export async function transformDatasetAction(prevState: any, formData: FormData) {
  const validatedFields = transformSchema.safeParse({
    dataset: formData.get("dataset"),
    instruction: formData.get("instruction"),
  });

  if (!validatedFields.success) {
    return {
      message: "Invalid input for dataset transformation.",
      data: null,
      error: true,
    };
  }

  try {
    const result = await enhanceDataset({
      dataset: validatedFields.data.dataset,
      enhancements: [validatedFields.data.instruction],
    });

    return {
      message: "success",
      data: result.enhancedDataset,
      error: false,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "An unexpected error occurred during transformation. The AI may have had trouble applying the changes.",
      data: null,
      error: true,
    };
  }
}


const chartSuggestionSchema = z.object({
  dataset: z.string().min(1, "Dataset is missing."),
});

export async function getChartSuggestionAction(prevState: any, formData: FormData) {
    const validatedFields = chartSuggestionSchema.safeParse({
        dataset: formData.get("dataset"),
    });

    if (!validatedFields.success) {
        return {
            message: "Invalid input for chart suggestion.",
            data: null,
            error: true,
        };
    }

    try {
        const result = await generateChartSuggestion({ dataset: validatedFields.data.dataset });
        return {
            message: "success",
            data: result,
            error: false,
        };
    } catch (error) {
        console.error("Chart Suggestion Error:", error);
        return {
            message: "An unexpected error occurred while generating the chart suggestion.",
            data: null,
            error: true,
        };
    }
}
