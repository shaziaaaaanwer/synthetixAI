
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Clipboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodeBlockProps {
  code: string;
}

export function CodeBlock({ code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast({ title: "Copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative my-4">
      <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto text-muted-foreground">
        <code>{code}</code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-7 w-7"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
        <span className="sr-only">{copied ? "Copied" : "Copy code"}</span>
      </Button>
    </div>
  );
}
