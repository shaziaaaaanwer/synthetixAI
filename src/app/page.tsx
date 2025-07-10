
"use client"; // Make it a client component to use hooks

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/icons/logo"
import Link from "next/link"
import { ArrowRight, BarChart2, FileUp, Search, Send, Users, Wand2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import { ThemeToggle } from "@/components/common/theme-toggle"

const features = [
  {
    icon: <Wand2 className="h-8 w-8 text-primary" />,
    title: 'Generate Data from a Prompt',
    description: 'Describe the dataset you need in plain English. From simple lists to complex nested JSON, our AI understands your request and generates the data in seconds.',
  },
  {
    icon: <FileUp className="h-8 w-8 text-primary" />,
    title: 'Upload & Enhance Your Data',
    description: 'Upload your existing CSV, JSON, or Excel files. Let our AI fill missing values, anonymize sensitive information, or convert your real data into a synthetic version.',
  },
  {
    icon: <BarChart2 className="h-8 w-8 text-primary" />,
    title: 'Instant Data Insights',
    description: 'Get a deep understanding of any dataset. The AI provides summary statistics, value distributions, and suggests insightful charts to visualize your data.',
  },
  {
    icon: <Search className="h-8 w-8 text-primary" />,
    title: 'Query with Natural Language',
    description: "Ask questions about your data in plain English. Get quick answers without writing a single line of SQL, like 'What's the average price of products in the 'Electronics' category?'",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Collaborate in Workspaces',
    description: 'Create shared workspaces for your team. Save generated datasets, leave comments, and ensure everyone is working with the same high-quality data.',
  },
  {
    icon: <Send className="h-8 w-8 text-primary" />,
    title: 'Integrate with Your Tools',
    description: 'Seamlessly export your data to CSV, JSON, and Excel, or send it directly to Google Sheets, GitHub Gists, and Google Colab for further analysis.',
  },
]

function HeaderAuthButtons() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex gap-2 sm:gap-4">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
            </div>
        )
    }

    if (user) {
        return (
            <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                    <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button asChild>
                    <Link href="/dashboard">Get Started</Link>
                </Button>
            </>
        )
    }

    return (
        <>
            <Button asChild variant="ghost">
                <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
                <Link href="/login">Sign Up</Link>
            </Button>
        </>
    )
}

export default function LandingPage() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b shrink-0">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline-block">SynthetiX.AI</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 sm:gap-4">
          <HeaderAuthButtons />
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Generate, Enhance, and Understand Your Data Instantly
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    SynthetiX.AI is your complete toolkit for synthetic data. Generate from prompts, enhance existing files, get deep insights, and collaborate with your team—all in one place.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href={user ? "/dashboard" : "/login"}>
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative mx-auto aspect-square w-full max-w-[400px] overflow-hidden rounded-xl border bg-primary font-mono text-sm shadow-xl lg:order-last lg:max-w-none hidden md:block">
                <div className="flex h-8 items-center gap-1.5 border-b border-secondary bg-background px-4">
                    <div className="h-3 w-3 rounded-full bg-destructive"></div>
                    <div className="h-3 w-3 rounded-full bg-chart-4"></div>
                    <div className="h-3 w-3 rounded-full bg-chart-2"></div>
                </div>
                <div className="p-6 text-primary-foreground">
                <p><span className="text-chart-3">{"{"}</span></p>
                <p className="pl-4">
                    <span className="text-chart-1">"users"</span>
                    <span className="text-muted-foreground">: [</span>
                </p>
                <p className="pl-8"><span className="text-chart-3">{"{"}</span></p>
                <p className="pl-12">
                    <span className="text-chart-1">"name"</span>
                    <span className="text-muted-foreground">: </span>
                    <span className="text-chart-5">"Alice"</span>
                    <span className="text-muted-foreground">,</span>
                </p>
                <p className="pl-12">
                    <span className="text-chart-1">"email"</span>
                    <span className="text-muted-foreground">: </span>
                    <span className="text-chart-5">"alice@synthetix.ai"</span>
                </p>
                <p className="pl-8"><span className="text-chart-3">{"}"}</span></p>
                <p className="pl-4"><span className="text-muted-foreground">]</span></p>
                <p><span className="text-chart-3">{"}"}</span></p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Powerful Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">An End-to-End Data Toolkit</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From generation to collaboration, SynthetiX.AI provides the tools you need to accelerate your entire development lifecycle.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              {features.map((feature) => (
                <div key={feature.title} className="grid gap-4 p-6 rounded-lg bg-card text-card-foreground shadow-sm">
                  {feature.icon}
                  <div className="grid gap-1">
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 SynthetiX.AI. All rights reserved.</p>
      </footer>
    </div>
  )
}
