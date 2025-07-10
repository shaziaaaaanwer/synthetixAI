
"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, Clipboard, Check, Send, Sheet, Database, Loader2, Github } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import * as XLSX from "xlsx"
import { useToast } from "@/hooks/use-toast"
import { sendToWebhookAction, sendToGoogleSheetsAction, sendToGistAction, sendToColabAction } from "@/app/actions"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore"
import type { Workspace } from "@/app/workspace/page"
import { useAuth } from "@/hooks/use-auth"

interface DatasetViewerProps {
  data: string | null;
  title: string;
}

export function DatasetViewer({ data, title }: DatasetViewerProps) {
  const { user } = useAuth();
  const [tableData, setTableData] = useState<any[]>([])
  const [tableHeaders, setTableHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<string>("")
  const [isTableFriendly, setIsTableFriendly] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("json")
  
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSendingSheets, setIsSendingSheets] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  
  const [gistDialogOpen, setGistDialogOpen] = useState(false);
  const [isSendingGist, setIsSendingGist] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [gistFilename, setGistFilename] = useState("dataset.json");
  const [gistDescription, setGistDescription] = useState("");
  
  const [colabDialogOpen, setColabDialogOpen] = useState(false);
  const [isSendingColab, setIsSendingColab] = useState(false);
  const [githubTokenForColab, setGithubTokenForColab] = useState("");
  const [colabGistFilename, setColabGistFilename] = useState("dataset.json");

  const [firebaseDialogOpen, setFirebaseDialogOpen] = useState(false);
  const [isSendingFirebase, setIsSendingFirebase] = useState(false);
  const [datasetTitle, setDatasetTitle] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);

  const formattedJson = (() => {
    if (!data) return "";
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      return data;
    }
  })();

  useEffect(() => {
    if (!data) {
      setTableData([]);
      setTableHeaders([]);
      setCsvData("");
      setIsTableFriendly(false);
      return;
    }

    setTableData([]);
    setTableHeaders([]);
    setCsvData("");
    setIsTableFriendly(false);

    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
        const headers = Object.keys(parsed[0]);
        setTableHeaders(headers);
        setTableData(parsed);

        const csvHeader = headers.join(',');
        const csvBody = parsed.map(row =>
          headers.map(header => {
            const value = String(row[header] ?? '');
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        ).join('\n');
        setCsvData(`${csvHeader}\n${csvBody}`);

        setIsTableFriendly(true);
        setActiveTab("table");
        setGistFilename('dataset.json');
        setColabGistFilename('dataset.json');
        return;
      }
    } catch (e) {
      // Not JSON
    }

    if (typeof data === 'string' && data.includes(',') && data.includes('\n')) {
      const lines = data.trim().split('\n');
      if (lines.length > 1) {
        const headerLine = lines.shift()!;
        const headers = headerLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().replace(/^"|"$/g, ''));
        const rows = lines.map(line => {
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          const rowObj: {[key: string]: string} = {};
          headers.forEach((header, i) => {
              let value = values[i] ? values[i].trim() : "";
              if (value.startsWith('"') && value.endsWith('"')) {
                  value = value.substring(1, value.length - 1).replace(/""/g, '"');
              }
              rowObj[header] = value;
          });
          return rowObj;
        });

        setTableHeaders(headers);
        setTableData(rows);
        setCsvData(data);
        setIsTableFriendly(true);
        setActiveTab("table");
        setGistFilename('dataset.csv');
        setColabGistFilename('dataset.csv');
        return;
      }
    }

    setActiveTab("json");
    setGistFilename('dataset.txt');
    setColabGistFilename('dataset.txt');

  }, [data]);

  const handleCopy = () => {
    let contentToCopy = "";
    let format = "JSON";

    if (activeTab === "json") {
      contentToCopy = formattedJson;
      format = "JSON";
    } else if (activeTab === "csv") {
      contentToCopy = csvData;
      format = "CSV";
    } else {
      contentToCopy = formattedJson;
      format = "JSON";
    }
    
    if (!contentToCopy) return;

    navigator.clipboard.writeText(contentToCopy).then(() => {
      toast({
        title: "Copied to clipboard!",
        description: `Data copied in ${format} format.`,
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExport = (format: 'json' | 'csv' | 'xlsx') => {
    if (!data) return;

    let blob: Blob;
    let filename: string;

    if (format === 'json') {
      blob = new Blob([formattedJson], { type: 'application/json' });
      filename = 'dataset.json';
    } else if (format === 'csv') {
      if (!isTableFriendly) return;
      blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      filename = 'dataset.csv';
    } else {
      if (!isTableFriendly) return;
      const ws = XLSX.utils.json_to_sheet(tableData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      blob = new Blob([wbout], { type: 'application/octet-stream' });
      filename = 'dataset.xlsx';
    }

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleSendToWebhook = async () => {
    if (!data || !webhookUrl) return;
    setIsSending(true);
    const result = await sendToWebhookAction({ dataset: data, url: webhookUrl });
    setIsSending(false);
    
    if (result.error) {
        toast({ variant: "destructive", title: "Webhook Failed", description: result.error });
    } else {
        toast({ title: "Success!", description: "Dataset sent to webhook." });
        setWebhookDialogOpen(false);
        setWebhookUrl("");
    }
  }

  const handleSendToGoogleSheets = async () => {
    if (!data) return;
    setIsSendingSheets(true);

    try {
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/spreadsheets');
        provider.setCustomParameters({
          prompt: 'consent'
        });
        
        const result = await signInWithPopup(auth, provider);
        
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential?.accessToken;

        if (!accessToken) {
            throw new Error("Could not retrieve access token from Google.");
        }

        const actionResult = await sendToGoogleSheetsAction({
            dataset: data,
            accessToken,
        });

        if (actionResult.error) {
            toast({ variant: "destructive", title: "Google Sheets Export Failed", description: actionResult.error, duration: 10000 });
        } else if (actionResult.success && actionResult.url) {
            toast({ 
                title: "Success!", 
                description: (
                    <>
                        Dataset sent to Google Sheets.
                        <a href={actionResult.url} target="_blank" rel="noopener noreferrer" className="ml-2 font-bold underline">
                            Open Sheet
                        </a>
                    </>
                ),
            });
        }
    } catch (error: any) {
        console.error("Google Sheets Auth Error:", error);
        let errorMessage = "Could not sign in with Google. Please try again.";
        if (error.code === 'auth/unauthorized-domain') {
            const cleanDomain = () => {
                let domain = window.location.hostname;
                const portPrefixRegex = /^\d+-/;
                if (portPrefixRegex.test(domain)) {
                    domain = domain.replace(portPrefixRegex, '');
                }
                return domain;
            }
            errorMessage = `This app's domain is not authorized. Please add the base domain "${cleanDomain()}" to your Firebase project's authorized domains list.`;
        } else if (error.message) {
            errorMessage = error.message;
        }
        toast({ variant: "destructive", title: "Authentication Failed", description: errorMessage });
    } finally {
        setIsSendingSheets(false);
    }
  }

  const handleSendToGist = async () => {
    if (!data || !githubToken || !gistFilename) return;
    setIsSendingGist(true);
    const result = await sendToGistAction({
        dataset: data,
        token: githubToken,
        filename: gistFilename,
        description: gistDescription,
    });
    setIsSendingGist(false);

    if (result.error) {
        toast({ variant: "destructive", title: "Gist Creation Failed", description: result.error, duration: 9000 });
    } else if (result.url) {
        toast({
            title: "Success!",
            description: (
                <>
                    Secret Gist created on GitHub.
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="ml-2 font-bold underline">
                        Open Gist
                    </a>
                </>
            ),
        });
        setGistDialogOpen(false);
        setGithubToken("");
        setGistFilename("dataset.json");
        setGistDescription("");
    }
  }
  
  const handleSendToColab = async () => {
    if (!data || !githubTokenForColab || !colabGistFilename) return;
    setIsSendingColab(true);
    const result = await sendToColabAction({
        dataset: data,
        token: githubTokenForColab,
        filename: colabGistFilename,
    });
    setIsSendingColab(false);

    if (result.error) {
        toast({ variant: "destructive", title: "Colab Gist Failed", description: result.error, duration: 9000 });
    } else if (result.url) {
        toast({
            title: "Success! Colab Notebook Ready.",
            description: (
                <>
                    Your data is ready to be explored.
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="ml-2 font-bold underline">
                        Open in Colab
                    </a>
                </>
            ),
            duration: 15000
        });
        setColabDialogOpen(false);
        setGithubTokenForColab("");
    }
  }

  const handleOpenFirebaseDialog = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Not Signed In", description: "You must be signed in to save to a workspace."});
      return;
    }
    
    setFirebaseDialogOpen(true);
    setIsLoadingWorkspaces(true);
    
    try {
      const workspacesRef = collection(db, "workspaces");
      const q = query(workspacesRef, where("memberUids", "array-contains", user.uid));
      const querySnapshot = await getDocs(q);
      const fetchedWorkspaces: Workspace[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workspace));
      setWorkspaces(fetchedWorkspaces);
      if (fetchedWorkspaces.length > 0) {
        setSelectedWorkspace(fetchedWorkspaces[0].id);
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      toast({ variant: "destructive", title: "Could not load workspaces", description: "Please check your connection and try again."});
      setFirebaseDialogOpen(false);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }

  const handleSendToFirebase = async () => {
    if (!data || !datasetTitle || !selectedWorkspace) return;
    setIsSendingFirebase(true);

    try {
      if (!user) throw new Error("You must be signed in to save to Firebase.");

      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch (error) {
        throw new Error("Cannot save to Firebase because the data is not valid JSON.");
      }

      if (!Array.isArray(parsedData)) {
           throw new Error("Only JSON arrays can be saved to Firebase.");
      }

      const subCollectionRef = collection(db, "workspaces", selectedWorkspace, "datasets");
      
      await addDoc(subCollectionRef, {
        userId: user.uid,
        userEmail: user.email,
        title: datasetTitle,
        createdAt: serverTimestamp(),
        data: parsedData,
      });

      toast({
        title: "Success!",
        description: (
          <>
            Dataset saved to workspace.
            <Link href={`/workspace/${selectedWorkspace}`} className="ml-2 font-bold underline">
                View Workspace
            </Link>
          </>
        ),
      });
      setFirebaseDialogOpen(false);
      setDatasetTitle("");

    } catch (error: any) {
      console.error("Firebase Save Error:", error);
      const isValidationError = error.message.includes("You must be signed in") || error.message.includes("not valid JSON") || error.message.includes("Only JSON arrays");
      const isPermissionsError = error.code === 'permission-denied';

      let description = error.message;
      if (isPermissionsError) {
        description = "Permission denied. Please check your Firestore security rules to allow writes to the workspace's 'datasets' subcollection for authenticated members."
      }

      toast({ 
        variant: "destructive", 
        title: isValidationError ? "Invalid Data" : "Save Failed", 
        description: description,
        duration: 9000,
       });

    } finally {
      setIsSendingFirebase(false);
    }
  };


  if (!data) return null

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <TooltipProvider>
            <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={handleCopy} disabled={copied}>
                            {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                            <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{copied ? "Copied!" : "Copy to clipboard"}</p>
                    </TooltipContent>
                </Tooltip>
                
                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Download className="h-4 w-4" />
                                    <span className="sr-only">Export</span>
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Export data</p>
                        </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleExport('json')}>
                            Export as JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('csv')} disabled={!isTableFriendly}>
                            Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('xlsx')} disabled={!isTableFriendly}>
                            Export as XLSX
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Dialog open={firebaseDialogOpen} onOpenChange={setFirebaseDialogOpen}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={handleOpenFirebaseDialog} disabled={isSendingFirebase || !isTableFriendly}>
                                {isSendingFirebase ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                                <span className="sr-only">Save to Workspace</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Save to Workspace</p>
                        </TooltipContent>
                    </Tooltip>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Save to Workspace</DialogTitle>
                            <DialogDescription>
                                Choose a workspace and give your dataset a title to save it for your team.
                            </DialogDescription>
                        </DialogHeader>
                        {isLoadingWorkspaces ? (
                            <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : workspaces.length > 0 ? (
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="workspace-select" className="text-right">Workspace</Label>
                                    <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a workspace" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {workspaces.map((ws) => (
                                        <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="dataset-title" className="text-right">Title</Label>
                                    <Input
                                        id="dataset-title"
                                        value={datasetTitle}
                                        onChange={(e) => setDatasetTitle(e.target.value)}
                                        className="col-span-3"
                                        placeholder="e.g., Q3 User Signups"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-4">
                                <p className="text-sm text-muted-foreground">You are not a member of any workspaces.</p>
                                <Button variant="link" asChild><Link href="/workspace">Create a workspace</Link></Button>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setFirebaseDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSendToFirebase} disabled={isSendingFirebase || !datasetTitle || !selectedWorkspace || isLoadingWorkspaces}>
                                {isSendingFirebase && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Send className="h-4 w-4" />
                                    <span className="sr-only">Send To</span>
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Send to integration</p>
                        </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setWebhookDialogOpen(true); }}>
                          <Send className="mr-2 h-4 w-4"/>
                          Webhook
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={handleSendToGoogleSheets} disabled={isSendingSheets || !isTableFriendly}>
                            {isSendingSheets ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sheet className="mr-2 h-4 w-4"/>}
                            Google Sheets
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setGistDialogOpen(true); }}>
                            <Github className="mr-2 h-4 w-4"/>
                            GitHub Gist
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setColabDialogOpen(true); }}>
                           <svg role="img" fill="currentColor" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path d="M21.525 12.003c0 3.99-2.235 6.84-4.83 6.84-2.58 0-4.815-2.85-4.815-6.84s2.235-6.84 4.815-6.84c2.595 0 4.83 2.85 4.83 6.84zm-3.09-.003c0-2.385-1.05-4.245-2.085-4.245-1.05 0-2.085 1.86-2.085 4.245s1.035 4.245 2.085 4.245c1.035 0 2.085-1.86 2.085-4.245zm-8.82 4.248c-1.05 0-2.085-1.86-2.085-4.245S8.565 7.76 9.615 7.76c1.035 0 2.085 1.86 2.085 4.245 0 2.385-1.05 4.248-2.085 4.248zm-2.4-11.13c-.93 0-1.635-.78-1.635-1.545S6.255.438 7.185.438c.945 0 1.635.78 1.635 1.545S8.13 3.528 7.185 3.528zM4.8 12.003c0-2.385-1.05-4.245-2.085-4.245C1.665 7.758.615 9.618.615 12.003s1.05 4.245 2.085 4.245c1.05 0 2.1-1.86 2.1-4.245z"/></svg>
                           Google Colab
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="table" disabled={!isTableFriendly}>Table</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="csv" disabled={!isTableFriendly}>CSV</TabsTrigger>
          </TabsList>
          <TabsContent value="table">
            <div className="relative max-h-[500px] overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    {tableHeaders.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {tableHeaders.map((header) => (
                        <TableCell key={`${rowIndex}-${header}`}>
                          {String(row[header] ?? '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="json">
            <div className="relative max-h-[500px] overflow-auto rounded-md bg-muted p-4">
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap">{formattedJson}</pre>
            </div>
          </TabsContent>
          <TabsContent value="csv">
             <div className="relative max-h-[500px] overflow-auto rounded-md bg-muted p-4">
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap">{csvData}</pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Send to Webhook</DialogTitle>
                  <DialogDescription>
                      Enter the URL of the webhook endpoint you want to send this dataset to. The data will be sent as a JSON POST request.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="webhook-url" className="text-right">URL</Label>
                      <Input
                          id="webhook-url"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          className="col-span-3"
                          placeholder="https://api.example.com/webhook"
                      />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSendToWebhook} disabled={isSending || !webhookUrl}>
                      {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      <Dialog open={gistDialogOpen} onOpenChange={setGistDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Send to GitHub Gist</DialogTitle>
                <DialogDescription>
                    This will create a new secret Gist on your GitHub account. You need a Personal Access Token with the `gist` scope.
                    <a href="https://github.com/settings/tokens/new?scopes=gist" target="_blank" rel="noopener noreferrer" className="ml-1 text-primary underline">
                        Create a token here.
                    </a>
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="gist-token">GitHub Token</Label>
                    <Input
                        id="gist-token"
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_..."
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="gist-filename">Filename</Label>
                    <Input
                        id="gist-filename"
                        value={gistFilename}
                        onChange={(e) => setGistFilename(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="gist-description">Description (optional)</Label>
                    <Input
                        id="gist-description"
                        value={gistDescription}
                        onChange={(e) => setGistDescription(e.target.value)}
                        placeholder="A short description for the Gist"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setGistDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSendToGist} disabled={isSendingGist || !githubToken || !gistFilename}>
                    {isSendingGist && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Gist
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={colabDialogOpen} onOpenChange={setColabDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Send to Google Colab</DialogTitle>
                <DialogDescription>
                    This will create a new secret GitHub Gist containing your data and a notebook to analyze it. It requires a Personal Access Token with the `gist` scope.
                    <a href="https://github.com/settings/tokens/new?scopes=gist" target="_blank" rel="noopener noreferrer" className="ml-1 text-primary underline">
                        Create a token here.
                    </a>
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="colab-gist-token">GitHub Token</Label>
                    <Input
                        id="colab-gist-token"
                        type="password"
                        value={githubTokenForColab}
                        onChange={(e) => setGithubTokenForColab(e.target.value)}
                        placeholder="ghp_..."
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="colab-gist-filename">Data Filename</Label>
                    <Input
                        id="colab-gist-filename"
                        value={colabGistFilename}
                        onChange={(e) => setColabGistFilename(e.target.value)}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setColabDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSendToColab} disabled={isSendingColab || !githubTokenForColab || !colabGistFilename}>
                    {isSendingColab && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create & Open
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
