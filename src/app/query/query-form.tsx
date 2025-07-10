
"use client"

import { useRef, useState, useActionState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { queryDatasetAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, Bot, AlertTriangle, Loader2, Upload, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import * as XLSX from "xlsx"
import { useToast } from "@/hooks/use-toast"
import { addToHistory } from "@/lib/history"

const initialQueryState: { message: string, data: string | null, error: boolean } = { message: "", data: null, error: false }

function QuerySubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Asking AI...</> : <><MessageSquare className="mr-2 h-4 w-4" /> Ask Question</>}
    </Button>
  )
}

export function QueryForm() {
  const [queryState, queryAction] = useActionState(queryDatasetAction, initialQueryState)
  const [datasetContent, setDatasetContent] = useState("")
  const [queryText, setQueryText] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const aiAnswer = queryState.data;
  
  useEffect(() => {
    if (aiAnswer && queryText && !queryState.error) {
        addToHistory({
            type: 'text',
            title: `AI Query: "${queryText.substring(0, 40)}${queryText.length > 40 ? '...' : ''}"`,
            data: aiAnswer,
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiAnswer, queryState.error]);


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
          <CardTitle>Query your Data</CardTitle>
          <CardDescription>Upload your dataset, ask a question in plain English, and get an answer from our AI.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={queryAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dataset-textarea">1. Your Dataset</Label>
              <Textarea
                id="dataset-textarea"
                name="dataset"
                value={datasetContent}
                onChange={(e) => setDatasetContent(e.target.value)}
                placeholder="Paste your dataset here (e.g., CSV or JSON format)"
                rows={8}
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
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                </Button>
            </div>
            <div className="space-y-2">
                <Label htmlFor="query-input">2. Your Question</Label>
                <Input
                    id="query-input"
                    name="query"
                    placeholder="e.g., What's the average sales by region?"
                    required
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                />
            </div>
            <QuerySubmitButton />
          </form>
        </CardContent>
      </Card>

      {queryState.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Query Error</AlertTitle>
          <AlertDescription>{queryState.message}</AlertDescription>
        </Alert>
      )}

      {aiAnswer && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot className="h-6 w-6" /> AI's Answer</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{aiAnswer}</p>
            </CardContent>
        </Card>
      )}

      {!aiAnswer && !queryState.error && (
         <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>The AI's answer will appear here.</AlertTitle>
            <AlertDescription>
              Provide your data and ask a question to get started.
            </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
