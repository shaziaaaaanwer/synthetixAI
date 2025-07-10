'use server';
/**
 * @fileOverview A flow that suggests and generates data for a chart based on a dataset.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChartSuggestionInputSchema = z.object({
  dataset: z.string().describe('The dataset to analyze for chart suggestions, in JSON or CSV format.'),
});
export type ChartSuggestionInput = z.infer<typeof ChartSuggestionInputSchema>;

const ChartSuggestionOutputSchema = z.object({
  chartType: z.enum(['bar', 'line', 'pie']).describe('The suggested type of chart.'),
  title: z.string().describe('A descriptive title for the chart.'),
  description: z.string().describe('A brief description of what the chart shows.'),
  chartData: z.string().describe('The data for the chart, formatted as a JSON string of an array of objects for Recharts.'),
  dataKey: z.string().describe('The primary key for the data values in the chart data (e.g., "count", "value").'),
  categoryKey: z.string().describe('The key for the categories or labels in the chart data (e.g., "name", "date").'),
});
export type ChartSuggestionOutput = z.infer<typeof ChartSuggestionOutputSchema>;

export async function generateChartSuggestion(input: ChartSuggestionInput): Promise<ChartSuggestionOutput> {
  return generateChartSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChartSuggestionPrompt',
  input: { schema: ChartSuggestionInputSchema },
  output: { schema: ChartSuggestionOutputSchema },
  prompt: `You are a data visualization expert. Given a dataset, your task is to propose a single, insightful chart that summarizes or highlights a key aspect of the data.

You must:
1.  Analyze the provided dataset.
2.  Decide on the most appropriate chart type from the available options: 'bar', 'line', or 'pie'.
3.  Generate a clear title and a brief, one-sentence description for the chart.
4.  Identify the key for the main data values (dataKey, e.g., for the y-axis) and the key for the categories/labels (categoryKey, e.g., for the x-axis).
5.  Transform and aggregate the raw data into a format suitable for direct use with a charting library like Recharts. The output 'chartData' must be a string containing a valid JSON array of objects. For example, for a bar chart of users per country, it should look like \`"[{\\"country\\": \\"USA\\", \\"users\\": 15}, {\\"country\\": \\"Canada\\", \\"users\\": 8}]"\`. Make sure the data is aggregated (e.g., counts, sums, averages).

Do not generate more than 10 data points for the chart to keep it readable.

Dataset:
\`\`\`
{{{dataset}}}
\`\`\`
`,
});

const generateChartSuggestionFlow = ai.defineFlow(
  {
    name: 'generateChartSuggestionFlow',
    inputSchema: ChartSuggestionInputSchema,
    outputSchema: ChartSuggestionOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
