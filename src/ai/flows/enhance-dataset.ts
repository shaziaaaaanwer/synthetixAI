'use server';

/**
 * @fileOverview A flow that enhances a dataset based on user-selected suggestions.
 *
 * - enhanceDataset - A function that applies enhancements to a dataset.
 * - EnhanceDatasetInput - The input type for the enhanceDataset function.
 * - EnhanceDatasetOutput - The return type for the enhanceDataset function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceDatasetInputSchema = z.object({
  dataset: z.string().describe('The original dataset to enhance, as a string (JSON or CSV).'),
  enhancements: z.array(z.string()).describe('An array of enhancement instructions to apply.'),
});
export type EnhanceDatasetInput = z.infer<typeof EnhanceDatasetInputSchema>;

const EnhanceDatasetOutputSchema = z.object({
  enhancedDataset: z.string().describe('The modified dataset in the same format as the original.'),
});
export type EnhanceDatasetOutput = z.infer<typeof EnhanceDatasetOutputSchema>;

export async function enhanceDataset(input: EnhanceDatasetInput): Promise<EnhanceDatasetOutput> {
  return enhanceDatasetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceDatasetPrompt',
  input: {schema: EnhanceDatasetInputSchema},
  output: {schema: EnhanceDatasetOutputSchema},
  prompt: `You are an expert data scientist and data transformation tool. You will be given a dataset and a list of instructions for how to enhance it.

Your task is to intelligently apply the requested enhancements to the dataset. This means you should not just add placeholder data, but generate realistic and varied information.

Your task is to:
1.  Carefully analyze the structure and content of the original dataset to understand its context.
2.  Apply ALL of the enhancement instructions to the dataset. When adding new data (like new columns or enriching existing ones), ensure the generated values are realistic, diverse, and consistent with the existing data. For example, if adding years, use a sensible range of years, not the same year for every row. If adding names, generate different names.
3.  Preserve the original data and structure as much as possible, only changing what is requested in the enhancements.
4.  Output the complete, modified dataset.
5.  IMPORTANT: The output format (e.g., JSON array of objects, CSV) must be the same as the original input dataset. Retain all original column names and their order, unless an enhancement specifically asks to modify them. If the output is in CSV format, you MUST include a header row with the column names as the very first line. Do not add any explanatory text, just the raw data.

Original Dataset:
\`\`\`
{{{dataset}}}
\`\`\`

Enhancement Instructions to apply:
{{#each enhancements}}
- {{this}}
{{/each}}
`,
});

const enhanceDatasetFlow = ai.defineFlow(
  {
    name: 'enhanceDatasetFlow',
    inputSchema: EnhanceDatasetInputSchema,
    outputSchema: EnhanceDatasetOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
