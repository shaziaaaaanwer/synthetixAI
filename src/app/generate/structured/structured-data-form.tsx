
"use client"

import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  suggestColumnTypeAction,
  generateStructuredDataAction,
} from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertTriangle,
  Bot,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Terminal
} from "lucide-react"
import { useEffect, useState, useTransition, useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { DatasetViewer } from "@/components/common/dataset-viewer"
import { addToHistory } from "@/lib/history"

const columnSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
})

const formSchema = z.object({
  columns: z.array(columnSchema).min(1, "At least one column is required."),
  count: z.coerce.number().int().min(1, "Must be at least 1").max(100, "Cannot be more than 100"),
})

type FormValues = z.infer<typeof formSchema>

const initialGenerateState = {
  message: "",
  data: null,
}

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
      {isPending ? (
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

export function StructuredDataForm() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [generateState, formAction] = useActionState(
    generateStructuredDataAction,
    initialGenerateState
  )
  const [suggestionStates, setSuggestionStates] = useState<Record<number, {loading: boolean}>>({})
  const [isGenerating, startGenerateTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      columns: [{ name: "", type: "", description: "" }],
      count: 10,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "columns",
  })
  
  useEffect(() => {
    const schemaParam = searchParams.get("schema");
    const countParam = searchParams.get("count");

    if (schemaParam) {
        try {
            const parsedSchema = JSON.parse(decodeURIComponent(schemaParam));
            const newCount = countParam ? parseInt(countParam, 10) : 10;
            
            if (Array.isArray(parsedSchema) && parsedSchema.length > 0) {
                form.reset({
                    columns: parsedSchema,
                    count: isNaN(newCount) ? 10 : newCount,
                });
                toast({
                  title: "Schema Loaded",
                  description: "The pre-built schema has been loaded into the form.",
                })
            }
        } catch (error) {
            console.error("Failed to parse schema from URL", error);
            toast({
              variant: "destructive",
              title: "Failed to load schema",
              description: "The schema from the URL was malformed.",
            })
        }
    }
}, [searchParams, form, toast]);

  useEffect(() => {
    if (generateState.data) {
        const columns = form.getValues("columns");
        const title = columns.map(c => c.name).filter(Boolean).join(', ').substring(0, 50);
        addToHistory({
            type: 'structured',
            title: `Structured: ${title || 'Untitled'}${title.length >= 50 ? '...' : ''}`,
            data: generateState.data,
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateState.data]);


  const handleSuggestType = async (index: number) => {
    setSuggestionStates(prev => ({...prev, [index]: {loading: true}}))
    const formData = new FormData()
    const columnName = form.getValues(`columns.${index}.name`)
    const columnDescription = form.getValues(`columns.${index}.description`)
    formData.append("columnName", columnName)
    formData.append("columnDescription", columnDescription || "")

    const result = await suggestColumnTypeAction(formData)

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Suggestion Failed",
        description: result.error,
      })
    } else if (result.data) {
      form.setValue(`columns.${index}.type`, result.data.columnType)
      if (result.data.explanation) {
         form.setValue(`columns.${index}.description`, result.data.explanation)
      }
      toast({
        title: "Suggestion Applied",
        description: `Set type to "${result.data.columnType}" for column "${columnName}".`,
      })
    }
    setSuggestionStates(prev => ({...prev, [index]: {loading: false}}))
  }

  const onSubmit = (data: FormValues) => {
    const formData = new FormData();
    formData.append("columns", JSON.stringify(data.columns));
    formData.append("count", String(data.count));
    startGenerateTransition(() => {
      formAction(formData);
    });
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dataset Schema</CardTitle>
          <CardDescription>
            Define the columns for your dataset. Use the magic wand to get AI-powered type suggestions.
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr,1fr,1fr,auto] gap-2 items-start p-3 border rounded-lg bg-background md:p-2">
                <div className="space-y-1">
                  <Label htmlFor={`columns.${index}.name`} className="text-xs md:text-sm">Column Name</Label>
                  <Input
                    id={`columns.${index}.name`}
                    {...form.register(`columns.${index}.name`)}
                    placeholder="e.g., user_id"
                  />
                   {form.formState.errors.columns?.[index]?.name && <p className="text-sm text-destructive">{form.formState.errors.columns?.[index]?.name?.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`columns.${index}.type`} className="text-xs md:text-sm">Column Type</Label>
                   <div className="flex gap-1">
                    <Input
                      id={`columns.${index}.type`}
                      {...form.register(`columns.${index}.type`)}
                      placeholder="e.g., string"
                    />
                     <Button type="button" variant="outline" size="icon" onClick={() => handleSuggestType(index)} disabled={suggestionStates[index]?.loading}>
                       {suggestionStates[index]?.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                       <span className="sr-only">Suggest Type</span>
                     </Button>
                   </div>
                   {form.formState.errors.columns?.[index]?.type && <p className="text-sm text-destructive">{form.formState.errors.columns?.[index]?.type?.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`columns.${index}.description`} className="text-xs md:text-sm">Description (optional)</Label>
                  <Input
                    id={`columns.${index}.description`}
                    {...form.register(`columns.${index}.description`)}
                    placeholder="Briefly describe the data"
                  />
                </div>
                 <div className="flex items-end h-full pt-2 md:pt-0">
                    <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove column</span>
                    </Button>
                 </div>
              </div>
            ))}
             <Button
                type="button"
                variant="outline"
                onClick={() => append({ name: "", type: "", description: "" })}
            >
                <Plus className="mr-2 h-4 w-4" /> Add Column
            </Button>
            <div className="max-w-xs pt-4">
                <Label htmlFor="count">Number of Rows (1-100)</Label>
                <Input
                    id="count"
                    type="number"
                    {...form.register("count")}
                />
                 {form.formState.errors.count && <p className="text-sm text-destructive">{form.formState.errors.count.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton isPending={isGenerating} />
          </CardFooter>
        </form>
      </Card>

      {generateState.message && generateState.message !== "success" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{generateState.message}</AlertDescription>
        </Alert>
      )}

      {generateState.data && <DatasetViewer data={generateState.data} title="Generated Data"/>}

      {!generateState.data && (
         <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Your generated data will appear here.</AlertTitle>
            <AlertDescription>
              Define your columns, specify the number of rows, and click "Generate Dataset".
            </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
