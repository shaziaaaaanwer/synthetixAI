import { StructuredDataForm } from './structured-data-form';
import { Suspense } from 'react';

export default function StructuredDataPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Mock Dataset</h1>
        <p className="text-muted-foreground">
          Manually build structured mock datasets with fine-grained control. Use AI to suggest column types.
        </p>
      </div>
      <Suspense fallback={<div className="text-center p-8 text-muted-foreground">Loading template...</div>}>
        <StructuredDataForm />
      </Suspense>
    </div>
  );
}
