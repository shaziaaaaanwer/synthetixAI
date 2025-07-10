import { config } from 'dotenv';
config();

import '@/ai/flows/synthetic-text-generator.ts';
import '@/ai/flows/generate-dataset-from-prompt.ts';
import '@/ai/flows/smart-column-suggestions.ts';
import '@/ai/flows/generate-structured-data.ts';
import '@/ai/flows/analyze-dataset.ts';
import '@/ai/flows/enhance-prompt.ts';
import '@/ai/flows/enhance-dataset.ts';
import '@/ai/flows/generate-chart-suggestion.ts';
import '@/ai/flows/get-data-insights.ts';
import '@/ai/flows/infer-schema-and-row-count.ts';
import '@/ai/flows/query-dataset.ts';
