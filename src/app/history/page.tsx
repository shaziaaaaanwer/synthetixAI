'use client';

import { useState, useEffect } from 'react';
import { getHistory, clearHistory, type HistoryItem } from '@/lib/history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DatasetViewer } from '@/components/common/dataset-viewer';
import { History, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadedHistory = getHistory();
    setHistory(loadedHistory);
  }, []);

  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const filtered = history.filter(item => new Date(item.createdAt) > thirtyDaysAgo);
    setFilteredHistory(filtered);
  }, [history]);

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
    toast({
      title: 'History Cleared',
      description: 'Your generation history has been removed from this browser.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Generation History</h1>
          <p className="text-muted-foreground">
            Here are the datasets you've generated in the last 30 days. This data is stored only in your browser.
          </p>
        </div>
        {history.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Clear History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your entire generation history from this browser. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {filteredHistory.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              {filteredHistory.map((item) => (
                <AccordionItem value={item.id} key={item.id} className="px-6 first:border-t-0 border-t">
                  <AccordionTrigger>
                    <div className="flex flex-col items-start text-left">
                        <span className="font-semibold">{item.title}</span>
                        <span className="text-sm text-muted-foreground">
                            {new Date(item.createdAt).toLocaleString()}
                        </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <DatasetViewer data={typeof item.data === 'string' ? item.data : JSON.stringify(item.data)} title="Generated Data" />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <History />
                No Recent History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You haven't generated any datasets in the last 30 days. Go to one of the "Generate" pages to create some data!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
