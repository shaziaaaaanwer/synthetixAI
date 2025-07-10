'use server';

/**
 * @fileOverview A flow that enhances a user's prompt for dataset generation.
 *
 * - enhancePrompt - A function that takes a user prompt and makes it more detailed.
 * - EnhancePromptInput - The input type for the enhancePrompt function.
 * - EnhancePromptOutput - The return type for the enhancePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhancePromptInputSchema = z.object({
  prompt: z.string().describe('The user\'s initial prompt for dataset generation.'),
});
export type EnhancePromptInput = z.infer<typeof EnhancePromptInputSchema>;

const EnhancePromptOutputSchema = z.object({
  enhancedPrompt: z.string().describe('The AI-enhanced, more detailed prompt.'),
});
export type EnhancePromptOutput = z.infer<typeof EnhancePromptOutputSchema>;

export async function enhancePrompt(input: EnhancePromptInput): Promise<EnhancePromptOutput> {
  return enhancePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhancePrompt',
  input: {schema: EnhancePromptInputSchema},
  output: {schema: EnhancePromptOutputSchema},
  prompt: `You are an AI assistant that helps users create better prompts for generating synthetic datasets.
You will be given a user's simple prompt. Your task is to enhance it by making it more specific, detailed, and structured.

A good enhanced prompt should:
- Strictly adhere to the columns/fields mentioned by the user. Do not add new ones.
- Suggest specific and realistic data types for the requested columns (e.g., 'firstName', 'email', 'uuid', 'productCategory', 'unixTimestamp').
- Specify a reasonable number of rows if not mentioned (default to 15).
- Add context or constraints to make the data more realistic *without adding new columns* (e.g., "users from a specific country" if country is mentioned, "products within a certain price range" if price is mentioned).
- Your primary goal is to add detail, realistic data types, and structure to the user's request, not to introduce new data categories.

Example:
User Prompt: "users with name and email"
Enhanced Prompt: "A list of 15 users, with columns for full_name (a realistic full name string) and email_address (a valid email format)."

User's prompt to enhance:
{{{prompt}}}

Generate only the enhanced prompt text, without any additional explanation or markdown.`,
});

const enhancePromptFlow = ai.defineFlow(
  {
    name: 'enhancePromptFlow',
    inputSchema: EnhancePromptInputSchema,
    outputSchema: EnhancePromptOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
