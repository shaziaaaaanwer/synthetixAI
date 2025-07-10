'use server';

/**
 * @fileOverview A flow that generates structured data based on a defined schema.
 *
 * - generateStructuredData - A function that generates a dataset based on column definitions.
 * - GenerateStructuredDataInput - The input type for the generateStructuredData function.
 * - GenerateStructuredDataOutput - The return type for the generateStructuredData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ColumnSchema = z.object({
  name: z.string().describe('The name of the column.'),
  type: z.string().describe('The data type of the column.'),
  description: z.string().optional().describe('A description of the column content.'),
});

const GenerateStructuredDataInputSchema = z.object({
  columns: z.array(ColumnSchema).describe('An array of column definitions for the dataset.'),
  count: z.coerce.number().int().min(1).describe('The number of rows to generate.'),
});
export type GenerateStructuredDataInput = z.infer<typeof GenerateStructuredDataInputSchema>;

const GenerateStructuredDataOutputSchema = z.object({
  dataset: z.string().describe('A synthetic dataset in JSON format matching the provided schema.'),
});
export type GenerateStructuredDataOutput = z.infer<typeof GenerateStructuredDataOutputSchema>;

export async function generateStructuredData(
  input: GenerateStructuredDataInput
): Promise<GenerateStructuredDataOutput> {
  return generateStructuredDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStructuredDataPrompt',
  input: {schema: GenerateStructuredDataInputSchema},
  output: {schema: GenerateStructuredDataOutputSchema},
  prompt: `You are an expert data generator. The user will provide a schema of columns (with names, types, and descriptions) and a desired number of rows.
You will generate a synthetic dataset in JSON array format that matches this schema.

Generate exactly {{{count}}} rows.

The schema is as follows:
{{#each columns}}
- Column Name: "{{name}}", Type: "{{type}}"{{#if description}}, Description: "{{description}}"{{/if}}
{{/each}}

Ensure the output is a valid JSON array of objects. Do not wrap it in a markdown block.
`,
});

const generateStructuredDataFlow = ai.defineFlow(
  {
    name: 'generateStructuredDataFlow',
    inputSchema: GenerateStructuredDataInputSchema,
    outputSchema: GenerateStructuredDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
