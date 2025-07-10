'use server';

/**
 * @fileOverview A flow that answers natural language questions about a dataset.
 *
 * - queryDataset - A function that answers a question about a dataset.
 * - QueryDatasetInput - The input type for the queryDataset function.
 * - QueryDatasetOutput - The return type for the queryDataset function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QueryDatasetInputSchema = z.object({
  dataset: z.string().describe('The dataset to query, as a string (can be JSON or CSV).'),
  query: z.string().describe('The natural language question to ask about the dataset.'),
});
export type QueryDatasetInput = z.infer<typeof QueryDatasetInputSchema>;

const QueryDatasetOutputSchema = z.object({
  answer: z.string().describe('The natural language answer to the user\'s question.'),
});
export type QueryDatasetOutput = z.infer<typeof QueryDatasetOutputSchema>;

export async function queryDataset(input: QueryDatasetInput): Promise<QueryDatasetOutput> {
  return queryDatasetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'queryDatasetPrompt',
  input: {schema: QueryDatasetInputSchema},
  output: {schema: QueryDatasetOutputSchema},
  prompt: `You are a world-class data analyst AI. You will be given a dataset and a question about it.
Your task is to analyze the dataset and provide a clear, concise, and accurate answer to the question.

If the question is subjective or requires complex operations you cannot perform (like creating customer segments without more info), provide a helpful response explaining what you can do and what additional information you might need. Do not invent data that is not present in the dataset.

Dataset (this may be a truncated sample of a larger file):
\`\`\`
{{{dataset}}}
\`\`\`

User's Question:
"{{{query}}}"
`,
});

const queryDatasetFlow = ai.defineFlow(
  {
    name: 'queryDatasetFlow',
    inputSchema: QueryDatasetInputSchema,
    outputSchema: QueryDatasetOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
