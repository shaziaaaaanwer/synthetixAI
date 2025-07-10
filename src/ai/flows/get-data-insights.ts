'use server';

/**
 * @fileOverview A flow that performs a comprehensive analysis of a dataset.
 *
 * - getDataInsights - A function that analyzes a dataset for insights.
 * - GetDataInsightsInput - The input type for the getDataInsights function.
 * - GetDataInsightsOutput - The return type for the getDataInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetDataInsightsInputSchema = z.object({
  dataset: z.string().describe('The dataset to analyze, as a string (can be JSON or CSV).'),
});
export type GetDataInsightsInput = z.infer<typeof GetDataInsightsInputSchema>;


const ColumnSummarySchema = z.object({
    mean: z.coerce.number().optional().describe('The mean of the column values (for numeric columns).'),
    median: z.coerce.number().optional().describe('The median of the column values (for numeric columns).'),
    stdDev: z.coerce.number().optional().describe('The standard deviation of the column values (for numeric columns).'),
    missingValues: z.coerce.number().int().describe('The number of missing/null values.'),
    distinctValues: z.coerce.number().int().describe('The number of unique values.'),
    dataType: z.string().describe("The inferred data type of the column (e.g., 'numeric', 'categorical', 'text').")
}).describe("The summary statistics for a column.");

const NamedColumnSummarySchema = z.object({
  columnName: z.string().describe("The name of the column being summarized."),
  stats: ColumnSummarySchema,
});


const ValueDistributionSchema = z.array(z.object({
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]).describe('The specific value in the column.'),
    count: z.coerce.number().int().describe('The number of times the value appears.')
})).describe('The distribution of values for a column.');

const NamedValueDistributionSchema = z.object({
  columnName: z.string().describe("The name of the column whose value distribution is described."),
  distribution: ValueDistributionSchema,
});

const VisualizationSuggestionSchema = z.object({
  chartType: z.enum(['bar', 'line', 'pie', 'histogram']).describe('The suggested type of chart.'),
  title: z.string().describe('A descriptive title for the chart.'),
  description: z.string().describe('A brief description of what the chart shows.'),
  chartData: z.string().describe('The data for the chart, formatted as a JSON string of an array of objects for Recharts.'),
  dataKey: z.string().describe('The primary key for the data values in the chart data (e.g., "count", "value").'),
  categoryKey: z.string().describe('The key for the categories or labels in the chart data (e.g., "name", "date").'),
});

const GetDataInsightsOutputSchema = z.object({
  summary: z.array(NamedColumnSummarySchema).describe('An array of summary statistics for each column.'),
  distributions: z.array(NamedValueDistributionSchema).optional().describe('An array of value distributions for key categorical columns.'),
  visualizations: z.array(VisualizationSuggestionSchema).describe('An array of suggested data visualizations.'),
});
export type GetDataInsightsOutput = z.infer<typeof GetDataInsightsOutputSchema>;


export async function getDataInsights(input: GetDataInsightsInput): Promise<GetDataInsightsOutput> {
  return getDataInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getDataInsightsPrompt',
  input: {schema: GetDataInsightsInputSchema},
  output: {schema: GetDataInsightsOutputSchema},
  prompt: `You are an expert data analyst. You will be given a dataset as a raw string.
Your task is to perform a comprehensive analysis and provide summary statistics and visualization suggestions.

Here are the instructions for generating the response:
1.  **Summary Statistics**: For each column in the dataset, calculate the following:
    *   Infer the data type ('numeric', 'categorical', 'text', 'date').
    *   For **numeric** columns: calculate mean, median, standard deviation, count of missing/null values, and count of distinct values.
    *   For **all other** columns: calculate count of missing/null values and count of distinct values. **IMPORTANT: For non-numeric columns, you MUST NOT include the \`mean\`, \`median\`, or \`stdDev\` fields at all in the output for that column's summary.**
    *   Present this in the \`summary\` field as an **array of objects**. Each object must have a \`columnName\` (string) and a \`stats\` object containing the statistics.

2.  **Value Distributions**: For the top 3-5 most important **categorical** columns (columns with a low number of distinct values), provide a count for each value. Limit each distribution to the top 10 most frequent values. Present this in the \`distributions\` field as an **array of objects**. Each object must have a \`columnName\` (string) and a \`distribution\` array of value/count pairs. If there are no suitable categorical columns, you can omit the \`distributions\` field.

3.  **Visualization Suggestions**: Based on your analysis, suggest up to 3 diverse and insightful visualizations from the following types: 'bar', 'pie', 'histogram', 'line'.
    *   For each suggestion, you MUST provide a \`title\`, \`description\`, \`chartType\`, \`dataKey\`, \`categoryKey\`, and the aggregated \`chartData\`.
    *   The \`chartData\` MUST be a string containing a valid JSON array of objects formatted for a library like Recharts. For example, for a bar chart of users per country, chartData should look like \`"[{\\"country\\": \\"USA\\", \\"users\\": 15}, {\\"country\\": \\"Canada\\", \\"users\\": 8}]"\`.
    *   The values you provide for \`dataKey\` and \`categoryKey\` MUST exist as keys in the objects within the \`chartData\` JSON string.
    *   Ensure the data is aggregated appropriately for the chart type (e.g., counts for histograms, sums or averages for bar charts).

Dataset (this may be a truncated sample of a larger file):
\`\`\`
{{{dataset}}}
\`\`\`
`,
});


const getDataInsightsFlow = ai.defineFlow(
  {
    name: 'getDataInsightsFlow',
    inputSchema: GetDataInsightsInputSchema,
    outputSchema: GetDataInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI returned an invalid response that could not be processed. Please try again.");
    }
    return output;
  }
);
