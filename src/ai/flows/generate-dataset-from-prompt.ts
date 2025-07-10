'use server';

/**
 * @fileOverview A flow that generates a synthetic dataset from a prompt by first inferring a schema and then generating data in batches.
 *
 * - generateDatasetFromPrompt - A function that generates a synthetic dataset from a prompt.
 * - GenerateDatasetFromPromptInput - The input type for the generateDatasetFromPrompt function.
 * - GenerateDatasetFromPromptOutput - The return type for the generateDatasetFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {inferSchemaAndRowCount} from './infer-schema-and-row-count';
import {generateStructuredData} from './generate-structured-data';

const GenerateDatasetFromPromptInputSchema = z.object({
  prompt: z.string().describe('A plain English description of the desired dataset.'),
});
export type GenerateDatasetFromPromptInput = z.infer<typeof GenerateDatasetFromPromptInputSchema>;

const GenerateDatasetFromPromptOutputSchema = z.object({
  dataset: z.string().describe('A synthetic dataset in JSON format matching the description.'),
});
export type GenerateDatasetFromPromptOutput = z.infer<typeof GenerateDatasetFromPromptOutputSchema>;

export async function generateDatasetFromPrompt(input: GenerateDatasetFromPromptInput): Promise<GenerateDatasetFromPromptOutput> {
  return generateDatasetFromPromptFlow(input);
}

// A single, resilient batch generation task with retries.
async function generateBatch(columns: any[], batchSize: number, batchNum: number): Promise<any[]> {
    let attempts = 0;
    const maxAttempts = 3;
    while(attempts < maxAttempts) {
        try {
            const result = await generateStructuredData({
                columns,
                count: batchSize,
            });
            const parsedBatch = JSON.parse(result.dataset);
            if (Array.isArray(parsedBatch)) {
                return parsedBatch; // Success
            }
            // If not an array, it's invalid, so we retry
            throw new Error(`AI returned non-array data for batch ${batchNum}.`);
        } catch (error) {
            attempts++;
            console.warn(`Batch ${batchNum} attempt ${attempts} failed. Retrying...`, error);
            if (attempts >= maxAttempts) {
                console.error(`Batch ${batchNum} failed permanently after ${maxAttempts} attempts.`, error);
                // Throw error on final attempt to be caught by Promise.allSettled
                throw error;
            }
        }
    }
    return []; // Should not be reached, but satisfies TypeScript
}


const generateDatasetFromPromptFlow = ai.defineFlow(
  {
    name: 'generateDatasetFromPromptFlow',
    inputSchema: GenerateDatasetFromPromptInputSchema,
    outputSchema: GenerateDatasetFromPromptOutputSchema,
  },
  async input => {
    // Step 1: Infer the schema and row count from the prompt.
    const inferredSchema = await inferSchemaAndRowCount({prompt: input.prompt});
    const {columns, count} = inferredSchema;

    if (!columns || columns.length === 0 || count <= 0) {
      throw new Error('Could not infer a valid schema or row count from the prompt.');
    }

    // Step 2: Create promises for all batches.
    const BATCH_SIZE = 50;
    const numBatches = Math.ceil(count / BATCH_SIZE);
    const batchPromises = [];

    for (let i = 0; i < numBatches; i++) {
        const remainingRows = count - (i * BATCH_SIZE);
        const currentBatchSize = Math.min(BATCH_SIZE, remainingRows);
        batchPromises.push(generateBatch(columns, currentBatchSize, i + 1));
    }
    
    // Step 3: Run all batch requests in parallel and collect results.
    const results = await Promise.allSettled(batchPromises);

    const combinedDataset: any[] = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          combinedDataset.push(...result.value);
      }
      // Rejected promises are ignored here; they are already logged in generateBatch
    });

    if (combinedDataset.length === 0 && count > 0) {
        throw new Error("All data generation batches failed. The AI may be having trouble with the request. Please try a simpler prompt.");
    }

    return {
      dataset: JSON.stringify(combinedDataset, null, 2),
    };
  }
);
