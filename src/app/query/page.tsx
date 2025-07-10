import { QueryForm } from './query-form';

export default function QueryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Query AI</h1>
        <p className="text-muted-foreground">
          Upload your dataset and ask natural language questions to get insights.
        </p>
      </div>
      <QueryForm />
    </div>
  )
}
