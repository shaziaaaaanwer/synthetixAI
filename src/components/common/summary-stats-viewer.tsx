"use client"

import type { GetDataInsightsOutput } from "@/ai/flows/get-data-insights"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface SummaryStatsViewerProps {
  summary: GetDataInsightsOutput['summary'];
}

export function SummaryStatsViewer({ summary }: SummaryStatsViewerProps) {
  if (!summary || summary.length === 0) {
    return null;
  }
  const headers = ["Column", "Data Type", "Mean", "Median", "Std. Dev.", "Missing", "Distinct"];

  return (
    <div className="relative max-h-[500px] overflow-auto rounded-md border">
        <Table>
            <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                    {headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                </TableRow>
            </TableHeader>
            <TableBody>
                {summary.map(({ columnName, stats }) => (
                    <TableRow key={columnName}>
                        <TableCell className="font-medium">{columnName}</TableCell>
                        <TableCell>{stats.dataType}</TableCell>
                        <TableCell>{stats.mean?.toFixed(2) ?? "N/A"}</TableCell>
                        <TableCell>{stats.median?.toFixed(2) ?? "N/A"}</TableCell>
                        <TableCell>{stats.stdDev?.toFixed(2) ?? "N/A"}</TableCell>
                        <TableCell>{stats.missingValues}</TableCell>
                        <TableCell>{stats.distinctValues}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  )
}
