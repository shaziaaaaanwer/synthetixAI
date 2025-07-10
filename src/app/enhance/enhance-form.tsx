
"use client"

import { useRef, useState, useEffect, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { analyzeDatasetAction, transformDatasetAction, getChartSuggestionAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, Bot, AlertTriangle, Loader2, Upload, FileJson, ShieldCheck, FlaskConical, AreaChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AnalyzeDatasetOutput } from "@/ai/flows/analyze-dataset"
import type { ChartSuggestionOutput } from "@/ai/flows/generate-chart-suggestion"
import { Label } from "@/components/ui/label"
import * as XLSX from "xlsx"
import { useToast } from "@/hooks/use-toast"
import { DatasetViewer } from "@/components/common/dataset-viewer"
import { ChartViewer } from "@/components/common/chart-viewer"
import { addToHistory } from "@/lib/history"

// Initial states for the actions
const initialAnalyzeState: { message: string, data: AnalyzeDatasetOutput | null, error: boolean } = { message: "", data: null, error: false }
const initialTransformState: { message: string, data: string | null, error: boolean } = { message: "", data: null, error: false }
const initialChartState: { message: string, data: ChartSuggestionOutput | null, error: boolean } = { message: "", data: null, error: false }

// Submit buttons
function AnalyzeSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Bot className="mr-2 h-4 w-4" /> Analyze Dataset</>}
    </Button>
  )
}

function ActionButton({ children, instruction, disabled }: { children: React.ReactNode, instruction: string, disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name="instruction" value={instruction} disabled={disabled || pending} className="w-full h-full text-left flex-col items-start justify-start p-4 transition-all hover:bg-accent/50">
      {pending ? <div className="flex flex-col items-start"><Loader2 className="h-6 w-6 animate-spin mb-2" /></div> : children}
    </Button>
  );
}

export function EnhanceForm() {
  const [analyzeState, analyzeAction] = useActionState(analyzeDatasetAction, initialAnalyzeState)
  const [transformState, transformAction] = useActionState(transformDatasetAction, initialTransformState)
  const [chartState, chartAction] = useActionState(getChartSuggestionAction, initialChartState)

  const [datasetContent, setDatasetContent] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const analysisData = analyzeState.data;
  const transformedData = transformState.data;
  const chartSuggestionData = chartState.data;

  // Clear results when dataset changes
  useEffect(() => {
    // This is a way to reset the action state when a dependency changes
    const emptyFormData = new FormData();
    if (transformState.data || transformState.error) transformAction(emptyFormData);
    if (chartState.data || chartState.error) chartAction(emptyFormData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetContent, analysisData])

  useEffect(() => {
    if (transformState.data) {
        addToHistory({
            type: 'enhanced',
            title: 'Enhanced Dataset',
            data: transformState.data,
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transformState.data]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    if (file.type === "application/json" || file.type === "text/csv") {
      reader.onload = (event) => {
        const text = event.target?.result as string
        setDatasetContent(text)
        toast({ title: "File loaded", description: `${file.name} content has been loaded into the textarea.` })
      }
      reader.readAsText(file)
    } else if (file.name.endsWith(".xlsx") || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      reader.onload = (event) => {
        try {
          const data = event.target?.result
          const workbook = XLSX.read(data, { type: "array" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(worksheet)
          setDatasetContent(JSON.stringify(json, null, 2))
          toast({ title: "Excel file loaded", description: `Data from ${file.name} has been converted to JSON and loaded.` })
        } catch (error) {
          console.error(error)
          toast({ variant: "destructive", title: "Error parsing Excel file", description: "The file might be corrupted or in an unsupported format." })
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      toast({ variant: "destructive", title: "Unsupported file type", description: "Please upload a JSON, CSV, or XLSX file." })
    }
  }

  const actions = [
    {
      title: "Fill Missing Values",
      description: "Intelligently complete empty cells in your dataset.",
      icon: <FileJson className="h-6 w-6 mb-2 text-primary" />,
      instruction: "Identify and fill in any missing or null values with realistic data consistent with the column.",
      action: transformAction,
    },
    {
      title: "Anonymize Sensitive Info",
      description: "Replace PII like names and emails with fake data.",
      icon: <ShieldCheck className="h-6 w-6 mb-2 text-primary" />,
      instruction: "Anonymize any columns containing PII (names, emails, phones, addresses) by replacing them with realistic fake data.",
      action: transformAction,
    },
    {
      title: "Convert to Synthetic",
      description: "Generate a new, artificial version of your dataset.",
      icon: <FlaskConical className="h-6 w-6 mb-2 text-primary" />,
      instruction: "Generate a new synthetic version of this dataset with the same columns and data types, but with completely new, realistically generated data.",
      action: transformAction,
    },
    {
      title: "Run Analysis & Charts",
      description: "Visualize your data with an AI-suggested chart.",
      icon: <AreaChart className="h-6 w-6 mb-2 text-primary" />,
      instruction: "chart",
      action: chartAction,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Step 1: Upload and Analyze */}
      <Card>
        <CardHeader>
            <CardTitle>Upload Dataset</CardTitle>
        </CardHeader>
        <CardContent>
            <form action={analyzeAction} className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="dataset-textarea">Paste your dataset or upload a file</Label>
                <Textarea
                    id="dataset-textarea"
                    name="dataset"
                    value={datasetContent}
                    onChange={(e) => setDatasetContent(e.target.value)}
                    placeholder="Paste your dataset here (e.g., CSV or JSON format)"
                    rows={10}
                    className="w-full"
                    required
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".json,.csv,.xlsx,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                <AnalyzeSubmitButton />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                </Button>
                </div>
            </form>
        </CardContent>
      </Card>

      {analyzeState.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>{analyzeState.message}</AlertDescription>
        </Alert>
      )}

      {/* Step 2: Choose Action */}
      {analysisData && (
        <Card>
          <CardHeader>
            <CardTitle>Choose an Action</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map(({ title, description, icon, instruction, action }) => (
              <form action={action} key={title}>
                <input type="hidden" name="dataset" value={datasetContent} />
                <ActionButton instruction={instruction} disabled={!datasetContent}>
                  <>
                    {icon}
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-normal">{description}</p>
                  </>
                </ActionButton>
              </form>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Display Results */}
      {transformState.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Transformation Error</AlertTitle>
          <AlertDescription>{transformState.message}</AlertDescription>
        </Alert>
      )}
      {transformedData && <DatasetViewer data={transformedData} title="Transformed Dataset" />}

      {chartState.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Chart Generation Error</AlertTitle>
          <AlertDescription>{chartState.message}</AlertDescription>
        </Alert>
      )}
      {chartSuggestionData && <ChartViewer chartData={chartSuggestionData} />}

      {!analysisData && !datasetContent && (
         <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Upload or paste your dataset to get started.</AlertTitle>
            <AlertDescription>
              Once your data is loaded, you can analyze it to unlock powerful enhancement and visualization actions.
            </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
