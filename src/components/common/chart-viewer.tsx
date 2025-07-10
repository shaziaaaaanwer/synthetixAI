
"use client"

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartSuggestionOutput as EnhanceChartSuggestionOutput } from '@/ai/flows/generate-chart-suggestion';
import type { GetDataInsightsOutput } from '@/ai/flows/get-data-insights';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

type Visualization = GetDataInsightsOutput['visualizations'][0];

interface ChartViewerProps {
  chartData: EnhanceChartSuggestionOutput | Visualization;
}

const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) {
    return null;
  }
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="hsl(var(--primary-foreground))"
      stroke="hsl(var(--primary))"
      strokeWidth={0.5}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


export function ChartViewer({ chartData: initialChartInfo }: ChartViewerProps) {
  const [chartInfo, setChartInfo] = React.useState(initialChartInfo);
  const [isEditing, setIsEditing] = React.useState(false);
  const id = React.useId();
  const editMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setChartInfo(initialChartInfo);
  }, [initialChartInfo]);

  React.useEffect(() => {
    if (isEditing) {
      editMenuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isEditing]);

  const data = React.useMemo(() => {
    if (!chartInfo || !chartInfo.chartData) return [];
    try {
      if (typeof chartInfo.chartData === 'string') {
        const parsed = JSON.parse(chartInfo.chartData);
        return Array.isArray(parsed) ? parsed : [];
      }
      if (Array.isArray(chartInfo.chartData)) {
        return chartInfo.chartData;
      }
    } catch (e) {
      console.error("Failed to parse chart data:", chartInfo.chartData, e);
    }
    return [];
  }, [chartInfo]);

  if (!chartInfo || data.length === 0) {
    return null;
  }

  const { chartType, title, description, dataKey, categoryKey } = chartInfo;

  const chartConfig = {
    [dataKey]: {
      label: dataKey,
      color: COLORS[0],
    },
  };

  const handleChartTypeChange = (value: string) => {
    setChartInfo(prev => ({
        ...prev,
        chartType: value as 'bar' | 'line' | 'pie' | 'histogram'
    }));
  }

  const renderChart = () => {
    switch (chartType) {
      case 'histogram':
      case 'bar':
        return (
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid horizontal={false} />
            <YAxis dataKey={categoryKey} type="category" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} interval={0} width={80} />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip cursor={{ fill: "hsl(var(--accent))" }} content={<ChartTooltipContent />} />
            <Bar dataKey={dataKey} fill="hsl(var(--primary))" radius={4} />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={categoryKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Tooltip content={<ChartTooltipContent nameKey={categoryKey} />} />
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={categoryKey}
              cx="50%"
              cy="50%"
              outerRadius={90}
              labelLine={false}
              label={renderCustomizedLabel}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: "20px" }} />
          </PieChart>
        );
      default:
        return <p>Unsupported chart type: {chartType}</p>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit Chart</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            {renderChart()}
        </ChartContainer>
      </CardContent>
       {isEditing && (
        <CardFooter ref={editMenuRef} className="flex-col items-start gap-4 border-t pt-6">
            <div className="flex justify-between items-center w-full">
              <h4 className="font-semibold text-base">Customize Chart</h4>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Done
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="space-y-2">
                    <Label htmlFor={`title-${id}`}>Chart Title</Label>
                    <Input
                        id={`title-${id}`}
                        value={chartInfo.title}
                        onChange={(e) => setChartInfo({...chartInfo, title: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`chartType-${id}`}>Chart Type</Label>
                    <Select
                        value={chartInfo.chartType}
                        onValueChange={handleChartTypeChange}
                    >
                        <SelectTrigger id={`chartType-${id}`}>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="bar">Bar Chart</SelectItem>
                            <SelectItem value="histogram">Histogram</SelectItem>
                            <SelectItem value="line">Line Chart</SelectItem>
                            <SelectItem value="pie">Pie Chart</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 col-span-full">
                    <Label htmlFor={`description-${id}`}>Chart Description</Label>
                    <Input
                        id={`description-${id}`}
                        value={chartInfo.description}
                        onChange={(e) => setChartInfo({...chartInfo, description: e.target.value})}
                    />
                </div>
            </div>
        </CardFooter>
       )}
    </Card>
  );
}
