// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting smart column types and data examples based on a column name or description.
 *
 * - smartColumnSuggestion - A function that takes a column name or description and suggests a relevant column type and data examples.
 * - SmartColumnSuggestionInput - The input type for the smartColumnSuggestion function.
 * - SmartColumnSuggestionOutput - The output type for the smartColumnSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartColumnSuggestionInputSchema = z.object({
  columnName: z.string().describe('The name of the column.'),
  columnDescription: z.string().optional().describe('A short description of the column.'),
});
export type SmartColumnSuggestionInput = z.infer<
  typeof SmartColumnSuggestionInputSchema
>;

const SmartColumnSuggestionOutputSchema = z.object({
  columnType: z.string().describe('Suggested data type for the column.'),
  dataExamples: z.array(z.string()).describe('Example data values for the column.'),
  explanation: z
    .string()
    .optional()
    .describe('Explanation of why the column type was suggested.'),
});
export type SmartColumnSuggestionOutput = z.infer<
  typeof SmartColumnSuggestionOutputSchema
>;

export async function smartColumnSuggestion(
  input: SmartColumnSuggestionInput
): Promise<SmartColumnSuggestionOutput> {
  return smartColumnSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartColumnSuggestionPrompt',
  input: {schema: SmartColumnSuggestionInputSchema},
  output: {schema: SmartColumnSuggestionOutputSchema},
  prompt: `You are an AI assistant helping users design dataset schemas. Given a column name and optional description, you will suggest a relevant column type and data examples.

Column Name: {{{columnName}}}
{{#if columnDescription}}
Column Description: {{{columnDescription}}}
{{/if}}

Suggest a column type and three example data values for this column.  Include a short explanation of why you suggested this column type.  Format the data examples as a JSON array of strings.

${JSON.stringify(SmartColumnSuggestionOutputSchema.shape, null, 2)}`,
});

const smartColumnSuggestionFlow = ai.defineFlow(
  {
    name: 'smartColumnSuggestionFlow',
    inputSchema: SmartColumnSuggestionInputSchema,
    outputSchema: SmartColumnSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
