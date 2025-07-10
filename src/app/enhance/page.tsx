import { EnhanceForm } from './enhance-form';

export default function EnhancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analyze & Enhance Dataset</h1>
        <p className="text-muted-foreground">
          Paste your own dataset or upload a file to get AI-powered analysis and enhancement suggestions.
        </p>
      </div>
      <EnhanceForm />
    </div>
  )
}
