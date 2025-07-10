import { InsightsForm } from './insights-form';

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Insights & Visualization</h1>
        <p className="text-muted-foreground">
          Upload your dataset to get AI-powered analysis, summary statistics, and chart suggestions.
        </p>
      </div>
      <InsightsForm />
    </div>
  )
}
