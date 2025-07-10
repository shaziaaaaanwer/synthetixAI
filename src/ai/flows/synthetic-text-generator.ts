'use server';

/**
 * @fileOverview A synthetic text data generator AI agent.
 *
 * - generateSyntheticText - A function that handles the text generation process.
 * - GenerateSyntheticTextInput - The input type for the generateSyntheticText function.
 * - GenerateSyntheticTextOutput - The return type for the generateSyntheticText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSyntheticTextInputSchema = z.object({
  textType: z.string().describe('The type of text to generate (e.g., product review, chat message, email).'),
  topic: z.string().optional().describe('The topic or subject of the text (optional).'),
  length: z.string().optional().describe('The desired length of the text (e.g., short, medium, long) (optional).'),
  style: z.string().optional().describe('The writing style of the text (e.g., formal, informal, humorous) (optional).'),
  count: z.number().int().min(1).default(1).describe('The number of text samples to generate.'),
});
export type GenerateSyntheticTextInput = z.infer<typeof GenerateSyntheticTextInputSchema>;

const GenerateSyntheticTextOutputSchema = z.object({
  texts: z.array(z.string()).describe('An array of generated text samples.'),
});
export type GenerateSyntheticTextOutput = z.infer<typeof GenerateSyntheticTextOutputSchema>;

export async function generateSyntheticText(input: GenerateSyntheticTextInput): Promise<GenerateSyntheticTextOutput> {
  return generateSyntheticTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSyntheticTextPrompt',
  input: {schema: GenerateSyntheticTextInputSchema},
  output: {schema: GenerateSyntheticTextOutputSchema},
  prompt: `You are an expert in generating synthetic text data for application testing.

You will generate realistic text samples based on the provided parameters.

Type of text: {{{textType}}}
Topic: {{{topic}}}
Length: {{{length}}}
Style: {{{style}}}

{{#if topic}}
The text should be related to the topic: {{{topic}}}.
{{/if}}

{{#if length}}
The text should be of the following length: {{{length}}}.
{{/if}}

{{#if style}}
The text should be written in the following style: {{{style}}}.
{{/if}}

Generate {{{count}}} text samples.

Output the generated texts as a JSON array of strings.
`, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generateSyntheticTextFlow = ai.defineFlow(
  {
    name: 'generateSyntheticTextFlow',
    inputSchema: GenerateSyntheticTextInputSchema,
    outputSchema: GenerateSyntheticTextOutputSchema,
  },
  async input => {
    const generatedTexts: string[] = [];
    for (let i = 0; i < input.count; i++) {
      const {output} = await prompt({...input, count: 1});
      if (output && output.texts && output.texts.length > 0) {
        generatedTexts.push(output.texts[0]);
      }
    }
    return {texts: generatedTexts};
  }
);
