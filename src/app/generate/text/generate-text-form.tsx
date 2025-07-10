
"use client"

import { useState, useEffect, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useSearchParams } from "next/navigation"
import { generateTextAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Bot, Clipboard, Loader2, FileText, Check } from "lucide-react"
import { addToHistory } from "@/lib/history"

const initialState = {
  message: "",
  data: null,
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Bot className="mr-2 h-4 w-4" />
          Generate Text
        </>
      )}
    </Button>
  )
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const onCopy = () => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Button variant="ghost" size="icon" onClick={onCopy}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
        </Button>
    )
}

export function GenerateTextForm() {
  const [state, formAction] = useActionState(generateTextAction, initialState)
  const searchParams = useSearchParams()

  const [textType, setTextType] = useState("")
  const [topic, setTopic] = useState("")
  const [length, setLength] = useState("medium")
  const [style, setStyle] = useState("informal")
  const [count, setCount] = useState("3")

  useEffect(() => {
    if (searchParams.has("textType")) {
      setTextType(searchParams.get("textType") || "")
    }
    if (searchParams.has("topic")) {
      setTopic(searchParams.get("topic") || "")
    }
    if (searchParams.has("length")) {
      setLength(searchParams.get("length") || "medium")
    }
    if (searchParams.has("style")) {
      setStyle(searchParams.get("style") || "informal")
    }
    if (searchParams.has("count")) {
      setCount(searchParams.get("count") || "3")
    }
  }, [searchParams])

  useEffect(() => {
    if (state.data) {
      addToHistory({
        type: 'text',
        title: `Text: ${textType || 'generic text'}`,
        data: JSON.stringify(state.data, null, 2),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.data]);

  return (
    <Card>
      <form action={formAction}>
        <CardHeader>
          <CardTitle>Text Generation Options</CardTitle>
          <CardDescription>
            Specify the type of text you want to generate and provide some context.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="textType">Type of Text</Label>
            <Input id="textType" name="textType" placeholder="e.g., Product Review, Email" required value={textType} onChange={(e) => setTextType(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic">Topic (optional)</Label>
            <Input id="topic" name="topic" placeholder="e.g., Wireless Headphones" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="length">Length</Label>
            <Select name="length" value={length} onValueChange={setLength}>
              <SelectTrigger id="length">
                <SelectValue placeholder="Select length" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="long">Long</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="style">Style</Label>
            <Select name="style" value={style} onValueChange={setStyle}>
              <SelectTrigger id="style">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="informal">Informal</SelectItem>
                <SelectItem value="humorous">Humorous</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="count">Number of samples (1-10)</Label>
            <Input id="count" name="count" type="number" min="1" max="10" value={count} onChange={(e) => setCount(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
            <SubmitButton />
            {state.message && state.message !== "success" && (
                <Alert variant="destructive" className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            )}
        </CardFooter>
      </form>
      {state.data && (
        <div className="p-6 pt-0 space-y-4">
            <h3 className="text-lg font-semibold">Generated Texts</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(state.data as string[]).map((text, index) => (
                <Card key={index} className="flex flex-col">
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                       <CardTitle className="text-sm font-medium">Sample #{index + 1}</CardTitle> 
                       <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground">{text}</p>
                    </CardContent>
                    <CardFooter>
                       <CopyButton text={text} />
                    </CardFooter>
                </Card>
            ))}
            </div>
        </div>
      )}
    </Card>
  )
}
