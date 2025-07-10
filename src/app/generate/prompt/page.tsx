import { GenerateFromPromptForm } from './generate-from-prompt-form';

export default function GenerateFromPromptPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Generate Dataset from Prompt</h1>
        <p className="text-muted-foreground">
          Simply describe the dataset you want in plain English, and our AI will generate it for you.
        </p>
      </div>
      <GenerateFromPromptForm />
    </div>
  );
}
