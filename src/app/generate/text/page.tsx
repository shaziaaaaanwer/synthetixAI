import { GenerateTextForm } from "./generate-text-form"
import { Suspense } from "react";

export default function GenerateTextPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Synthetic Text Generator</h1>
        <p className="text-muted-foreground">
          Generate fake non-tabular content for NLP and UI testing.
        </p>
      </div>
      <Suspense fallback={<div className="text-center p-8 text-muted-foreground">Loading template...</div>}>
        <GenerateTextForm />
      </Suspense>
    </div>
  )
}
