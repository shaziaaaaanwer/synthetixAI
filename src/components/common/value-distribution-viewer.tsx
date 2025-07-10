"use client"

import type { GetDataInsightsOutput } from "@/ai/flows/get-data-insights"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

interface ValueDistributionViewerProps {
  distributions: GetDataInsightsOutput['distributions'];
}

export function ValueDistributionViewer({ distributions }: ValueDistributionViewerProps) {
  if (!distributions || distributions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Value Distributions</CardTitle>
        <CardDescription>Frequency of values for key categorical columns.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {distributions.map(({ columnName, distribution }) => (
          <div key={columnName}>
            <h4 className="font-semibold mb-2">{columnName}</h4>
            <ChartContainer config={{}} className="h-[200px] w-full">
              <BarChart data={distribution} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="value" type="category" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={10} width={60} interval={0} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip cursor={{ fill: "hsl(var(--accent))" }} content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={2} />
              </BarChart>
            </ChartContainer>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
