
"use client"

import { useRef, useState, useEffect } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { getInsightsAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, Bot, AlertTriangle, Loader2, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { GetDataInsightsOutput } from "@/ai/flows/get-data-insights"
import { Label } from "@/components/ui/label"
import * as XLSX from "xlsx"
import { useToast } from "@/hooks/use-toast"
import { SummaryStatsViewer } from "@/components/common/summary-stats-viewer"
import { ValueDistributionViewer } from "@/components/common/value-distribution-viewer"
import { ChartViewer } from "@/components/common/chart-viewer"

const initialInsightsState: { message: string, data: GetDataInsightsOutput | null, error: boolean } = { message: "", data: null, error: false }

function AnalyzeSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Bot className="mr-2 h-4 w-4" /> Get Insights</>}
    </Button>
  )
}

export function InsightsForm() {
  const [insightsState, insightsAction] = useFormState(getInsightsAction, initialInsightsState)
  const [datasetContent, setDatasetContent] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const insightsData = insightsState.data;

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle>Upload Dataset</CardTitle>
        </CardHeader>
        <CardContent>
            <form action={insightsAction} className="space-y-4">
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

      {insightsState.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>{insightsState.message}</AlertDescription>
        </Alert>
      )}

      {insightsData && (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Summary Statistics</CardTitle>
                    <CardDescription>An overview of each column in your dataset.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SummaryStatsViewer summary={insightsData.summary} />
                </CardContent>
            </Card>

            {insightsData.distributions && <ValueDistributionViewer distributions={insightsData.distributions} />}

            {insightsData.visualizations && insightsData.visualizations.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold">Visualization Suggestions</h3>
                    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                        {insightsData.visualizations.map((chart, index) => (
                            <ChartViewer key={index} chartData={chart} />
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}

      {!insightsData && !datasetContent && (
         <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Upload or paste your dataset to get started.</AlertTitle>
            <AlertDescription>
              Once your data is loaded, you can get AI-powered insights, statistics, and visualizations.
            </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
