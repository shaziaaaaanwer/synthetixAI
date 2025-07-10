'use server';

/**
 * @fileOverview A flow that infers a structured schema and row count from a natural language prompt.
 *
 * - inferSchemaAndRowCount - A function that infers schema and row count.
 * - InferSchemaAndRowCountInput - The input type for the function.
 * - InferSchemaAndRowCountOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ColumnSchema = z.object({
  name: z.string().describe('The name of the column.'),
  type: z.string().describe('The suggested data type for the column (e.g., firstName, email, integer, country).'),
  description: z.string().optional().describe('A brief description of what the column represents.'),
});

const InferSchemaAndRowCountInputSchema = z.object({
  prompt: z.string().describe('The user\'s natural language prompt for dataset generation.'),
});
export type InferSchemaAndRowCountInput = z.infer<typeof InferSchemaAndRowCountInputSchema>;


const InferSchemaAndRowCountOutputSchema = z.object({
  columns: z.array(ColumnSchema).describe('An array of column definitions inferred from the prompt.'),
  count: z.coerce.number().int().min(1).describe('The number of rows to generate, inferred from the prompt. Defaults to 15 if not specified.'),
  topic: z.string().describe('The overall topic or theme of the dataset (e.g., "students", "products", "users").'),
});
export type InferSchemaAndRowCountOutput = z.infer<typeof InferSchemaAndRowCountOutputSchema>;


export async function inferSchemaAndRowCount(input: InferSchemaAndRowCountInput): Promise<InferSchemaAndRowCountOutput> {
  return inferSchemaAndRowCountFlow(input);
}


const prompt = ai.definePrompt({
  name: 'inferSchemaPrompt',
  input: {schema: InferSchemaAndRowCountInputSchema},
  output: {schema: InferSchemaAndRowCountOutputSchema},
  prompt: `You are an expert at understanding data requirements from natural language. A user will provide a prompt, and you must infer a structured schema, the total number of rows requested, and the general topic.

Your task:
1.  **Analyze the prompt:** "{{prompt}}"
2.  **Identify columns:** Determine the columns the user wants. For each column, provide a concise name (using snake_case), a descriptive type (like 'firstName', 'email', 'age', 'schoolName'), and a brief description.
3.  **Identify row count:** Determine how many rows of data the user asked for. If they don't specify a number, default to 15.
4.  **Identify topic:** Extract the main subject of the dataset (e.g., students, products).

Provide the output in the specified JSON format.
`,
});

const inferSchemaAndRowCountFlow = ai.defineFlow(
  {
    name: 'inferSchemaAndRowCountFlow',
    inputSchema: InferSchemaAndRowCountInputSchema,
    outputSchema: InferSchemaAndRowCountOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
