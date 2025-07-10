
"use client"

import { Suspense, useState, useTransition, useEffect, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useSearchParams } from "next/navigation"
import { generateDatasetAction, enhancePromptAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, Bot, AlertTriangle, Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DatasetViewer } from "@/components/common/dataset-viewer"
import { addToHistory } from "@/lib/history"

const initialState = {
  message: "",
  data: null,
  error: false
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Bot className="mr-2 h-4 w-4" />
          Generate Dataset
        </>
      )}
    </Button>
  )
}

function GenerateFromPromptFormContent() {
  const [state, formAction] = useActionState(generateDatasetAction, initialState)
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [prompt, setPrompt] = useState("")
  const [isEnhancing, startEnhanceTransition] = useTransition()

  useEffect(() => {
    const urlPrompt = searchParams.get("prompt")
    if (urlPrompt) {
      setPrompt(urlPrompt)
    }
  }, [searchParams])

  useEffect(() => {
    if (state.data && prompt) {
      addToHistory({
        type: 'prompt',
        title: `From Prompt: "${prompt.substring(0, 40)}${prompt.length > 40 ? '...' : ''}"`,
        data: state.data,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.data]);

  const handleEnhancePrompt = async () => {
    startEnhanceTransition(async () => {
      if (prompt.length < 10) {
        toast({
          variant: "destructive",
          title: "Prompt too short",
          description: "Please enter a more detailed prompt to enhance.",
        })
        return
      }
      const formData = new FormData()
      formData.append("prompt", prompt)
      const result = await enhancePromptAction(formData)
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Enhancement Failed",
          description: result.error,
        })
      } else if (result.data) {
        setPrompt(result.data)
        toast({
          title: "Prompt Enhanced!",
          description: "Your prompt has been improved by AI.",
        })
      }
    })
  }


  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <div className="relative">
            <Textarea
            name="prompt"
            placeholder="e.g., 'A list of 10 users with name, email, and a random user agent string.'"
            rows={5}
            className="w-full pr-12"
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing}
                className="absolute bottom-2 right-2 text-primary hover:bg-primary/10"
                aria-label="Enhance prompt with AI"
            >
                {isEnhancing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            </Button>
        </div>
        <SubmitButton />
      </form>

      {state.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {state.data && <DatasetViewer data={state.data} title="Generated Data" />}

      {!state.data && (
         <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Your generated data will appear here.</AlertTitle>
            <AlertDescription>
              Provide a detailed description of the data you want to generate. You can use the ✨ button to let AI enhance your prompt.
            </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export function GenerateFromPromptForm() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-muted-foreground">Loading template...</div>}>
      <GenerateFromPromptFormContent />
    </Suspense>
  )
}
