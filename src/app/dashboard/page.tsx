
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BrainCircuit, Clock, FileText, FlaskConical, PencilLine, Search, Users, Wrench } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { getHistory, type HistoryItem } from '@/lib/history';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import { DatasetViewer } from '@/components/common/dataset-viewer';
import { Skeleton } from '@/components/ui/skeleton';

type Stats = {
    datasets: number;
    enhancements: number;
    queries: number;
    lastSeen: string;
};

type ChartData = {
    date: string;
    Generations: number;
    Enhancements: number;
    Queries: number;
}

const QUICK_ACTIONS = [
    { title: 'Generate Data', href: '/generate/prompt', icon: PencilLine, description: "Describe data in plain English." },
    { title: 'Enhance Dataset', href: '/enhance', icon: Wrench, description: "Upload and transform your data." },
    { title: 'AI Query Tool', href: '/query', icon: Search, description: "Ask questions about your data." },
    { title: 'View Workspaces', href: '/workspace', icon: Users, description: "Collaborate with your team." },
];

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const [isNewUser, setIsNewUser] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    
    const displayName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

    useEffect(() => {
        const loadedHistory = getHistory();
        setHistory(loadedHistory);
        
        if (user?.metadata.creationTime && user?.metadata.lastSignInTime) {
            const creation = new Date(user.metadata.creationTime).getTime();
            const lastSignIn = new Date(user.metadata.lastSignInTime).getTime();
            // Consider a new user if they signed in within 2 minutes of creating their account
            if (lastSignIn - creation < 120000) {
                setIsNewUser(true);
            }
        }
    }, [user]);

    const stats: Stats = useMemo(() => {
        if (history.length === 0) {
            return { datasets: 0, enhancements: 0, queries: 0, lastSeen: 'Never' };
        }
        return {
            datasets: history.filter(item => ['prompt', 'structured'].includes(item.type)).length,
            enhancements: history.filter(item => item.type === 'enhanced').length,
            queries: history.filter(item => item.type === 'text' && item.title.startsWith('AI Query:')).length,
            lastSeen: formatDistanceToNow(new Date(history[0].createdAt), { addSuffix: true }),
        }
    }, [history]);

    const chartData: ChartData[] = useMemo(() => {
        const activityMap = new Map<string, ChartData>();

        for (let i = 6; i >= 0; i--) {
            const date = format(subDays(new Date(), i), 'MMM d');
            activityMap.set(date, { date, Generations: 0, Enhancements: 0, Queries: 0 });
        }

        history.forEach(item => {
            const date = format(new Date(item.createdAt), 'MMM d');
            if (activityMap.has(date)) {
                const dayData = activityMap.get(date)!;
                if (['prompt', 'structured'].includes(item.type)) {
                    dayData.Generations++;
                } else if (item.type === 'enhanced') {
                    dayData.Enhancements++;
                } else if (item.type === 'text' && item.title.startsWith('AI Query:')) {
                    dayData.Queries++;
                }
            }
        });
        return Array.from(activityMap.values());
    }, [history]);

    const recentDatasets = useMemo(() => history.slice(0, 5), [history]);

    if (loading) {
        return <Skeleton className="w-full h-96" />;
    }

    return (
        <div className="flex flex-col gap-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Good day, <span className="text-primary">{displayName}</span>!
                    </h1>
                    <p className="text-muted-foreground">
                        {isNewUser ? "Welcome! Let's get started." : "Here’s a quick overview of your synthetic data activity."}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/workspace">Workspaces</Link>
                </Button>
            </header>

            {!isNewUser && (
                <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Datasets Created</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{stats.datasets}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Enhancements Done</CardTitle>
                            <FlaskConical className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{stats.enhancements}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">AI Queries Used</CardTitle>
                            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{stats.queries}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Last Seen</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{stats.lastSeen}</div></CardContent>
                    </Card>
                </section>
            )}

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Quick Actions</h2>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {QUICK_ACTIONS.map(action => (
                        <Link href={action.href} key={action.href} className="group">
                           <Card className="h-full transition-all group-hover:shadow-md group-hover:border-primary/50">
                               <CardHeader>
                                   <action.icon className="w-8 h-8 text-primary mb-2" />
                                   <CardTitle>{action.title}</CardTitle>
                                   <CardDescription>{action.description}</CardDescription>
                               </CardHeader>
                           </Card>
                        </Link>
                    ))}
                </div>
            </section>
            
            <div className="grid gap-8 grid-cols-1 lg:grid-cols-5">
                <section className="space-y-4 lg:col-span-3">
                    <h2 className="text-2xl font-semibold">Recent Datasets</h2>
                    <Card>
                        <CardContent className="p-0">
                            {recentDatasets.length > 0 ? (
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead className="hidden sm:table-cell">Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentDatasets.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium truncate max-w-xs">{item.title}</TableCell>
                                                <TableCell className="hidden sm:table-cell text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                     <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm">View</Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-4xl h-5/6 flex flex-col">
                                                            <DatasetViewer 
                                                                data={typeof item.data === 'string' ? item.data : JSON.stringify(item.data, null, 2)}
                                                                title={item.title}
                                                            />
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <p>Your recent datasets will appear here.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-4 lg:col-span-2">
                    <h2 className="text-2xl font-semibold">Recent Activity</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Last 7 Days</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--accent))' }}
                                        contentStyle={{
                                            background: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: 'var(--radius)',
                                        }}
                                    />
                                    <Legend iconSize={10} />
                                    <Bar dataKey="Generations" stackId="a" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Enhancements" stackId="a" fill="hsl(var(--chart-2))" />
                                    <Bar dataKey="Queries" stackId="a" fill="hsl(var(--chart-3))" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    );
}
