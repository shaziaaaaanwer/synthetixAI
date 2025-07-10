'use server';

/**
 * @fileOverview A flow that analyzes a dataset and suggests enhancements.
 *
 * - analyzeDataset - A function that analyzes a dataset.
 * - AnalyzeDatasetInput - The input type for the analyzeDataset function.
 * - AnalyzeDatasetOutput - The return type for the analyzeDataset function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeDatasetInputSchema = z.object({
  dataset: z.string().describe('The dataset to analyze, as a string (can be JSON or CSV).'),
});
export type AnalyzeDatasetInput = z.infer<typeof AnalyzeDatasetInputSchema>;

const AnalyzeDatasetOutputSchema = z.object({
  format: z.string().describe('The detected format of the dataset (e.g., JSON, CSV, unknown).'),
  columns: z.array(z.string()).describe('An array of detected column headers or keys.'),
  rowCount: z.number().int().describe('The number of rows detected in the dataset.'),
  enhancementSuggestions: z.array(z.string()).describe('An array of suggestions for enhancing the dataset.'),
});
export type AnalyzeDatasetOutput = z.infer<typeof AnalyzeDatasetOutputSchema>;

export async function analyzeDataset(input: AnalyzeDatasetInput): Promise<AnalyzeDatasetOutput> {
  return analyzeDatasetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDatasetPrompt',
  input: {schema: AnalyzeDatasetInputSchema},
  output: {schema: AnalyzeDatasetOutputSchema},
  prompt: `You are an expert data analyst. You will be given a dataset as a raw string. Note that the provided data may be a truncated sample of a larger dataset.

Your task is to:
1.  Detect the format of the data (e.g., JSON array of objects, CSV, or state 'unknown').
2.  Identify the column headers or object keys. If it's a CSV with no header, use "column_1", "column_2", etc.
3.  Count the number of data rows present in the provided sample (excluding any header row).
4.  Provide exactly three creative and useful suggestions for how this dataset could be enhanced or augmented. The suggestions should be actionable instructions that can be performed by another AI without additional information. For example, instead of "Add country from IP", suggest "Add a new 'country' column with varied, realistic country names". Another example: "Anonymize the 'email' column by replacing it with a fake email address".

Dataset:
{{{dataset}}}
`,
});

const analyzeDatasetFlow = ai.defineFlow(
  {
    name: 'analyzeDatasetFlow',
    inputSchema: AnalyzeDatasetInputSchema,
    outputSchema: AnalyzeDatasetOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
