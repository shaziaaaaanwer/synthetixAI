
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Rows3, TestTube, Star } from "lucide-react";
import Link from "next/link";

const topPrompts = [
  {
    title: "US Customer Profiles",
    description: "A detailed prompt to generate 500 realistic customer profiles from the United States.",
    icon: <FileText className="h-6 w-6 text-primary" />,
    href: "/generate/prompt?prompt=A dataset of 500 realistic customer profiles from the United States, including columns for full_name, street_address, city, state, zip_code, and a list of recent purchases with item_id and price.",
  },
  {
    title: "Startup Funding Data",
    description: "Generate a list of 50 startups with funding rounds, founders, and industry, founded between 2020 and 2024.",
    icon: <FileText className="h-6 w-6 text-primary" />,
    href: "/generate/prompt?prompt=A list of 50 startups with funding rounds, founders, and industry, founded between 2020 and 2024.",
  },
  {
    title: "Tech Employee Profiles",
    description: "A prompt to generate 200 employee profiles for a tech company, with roles, departments, salaries, and start dates.",
    icon: <FileText className="h-6 w-6 text-primary" />,
    href: "/generate/prompt?prompt=Generate a dataset of 200 employee profiles for a tech company, with roles, departments, salaries, and start dates.",
  }
];

const prebuiltSchemas = [
  {
    title: "Healthcare Patient Data",
    description: "A comprehensive schema for patient records, including demographics, visits, and diagnoses.",
    icon: <Rows3 className="h-6 w-6 text-primary" />,
    href: `/generate/structured?schema=${encodeURIComponent(JSON.stringify([
      { name: "patient_id", type: "uuid", description: "Unique identifier for the patient" },
      { name: "full_name", type: "fullName", description: "Patient's full name" },
      { name: "date_of_birth", type: "date", description: "Patient's birth date" },
      { name: "gender", type: "gender", description: "Patient's gender" },
      { name: "primary_physician", type: "fullName", description: "Primary care doctor" },
    ]))}&count=50`,
  },
  {
    title: "E-commerce Product Catalog",
    description: "A schema for a product list with details like SKU, price, category, and stock levels.",
    icon: <Rows3 className="h-6 w-6 text-primary" />,
    href: `/generate/structured?schema=${encodeURIComponent(JSON.stringify([
        { name: "sku", type: "string", description: "Stock Keeping Unit" },
        { name: "product_name", type: "productName", description: "Name of the product" },
        { name: "category", type: "productCategory", description: "e.g., 'Electronics', 'Apparel'" },
        { name: "price", type: "price", description: "Price of the product" },
        { name: "stock_quantity", type: "integer", description: "Number of items in stock" },
    ]))}&count=100`,
  },
  {
    title: "Banking Transactions",
    description: "A schema for financial transactions, including amount, date, type, and merchant details.",
    icon: <Rows3 className="h-6 w-6 text-primary" />,
    href: `/generate/structured?schema=${encodeURIComponent(JSON.stringify([
        { name: "transaction_id", type: "uuid", description: "Unique transaction ID" },
        { name: "account_id", type: "uuid", description: "Associated account ID" },
        { name: "transaction_date", type: "isoDateTime", description: "Date and time of transaction" },
        { name: "amount", type: "money", description: "Transaction amount" },
        { name: "merchant_name", type: "companyName", description: "Merchant where transaction occurred" },
    ]))}&count=200`,
  },
];

const textTemplates = [
    {
        title: "Mobile App Reviews",
        description: "Generate varied text reviews for a fictional mobile application, including ratings.",
        icon: <TestTube className="h-6 w-6 text-primary" />,
        href: "/generate/text?textType=Mobile App Review&topic=A new photo sharing app&length=medium&style=informal&count=5"
    },
    {
        title: "Customer Support Emails",
        description: "Create formal customer support email threads about a billing issue.",
        icon: <TestTube className="h-6 w-6 text-primary" />,
        href: "/generate/text?textType=Customer Support Email&topic=A subscription billing error&length=long&style=formal&count=3"
    },
    {
        title: "E-commerce Product Descriptions",
        description: "Write short and punchy product descriptions for wireless headphones.",
        icon: <TestTube className="h-6 w-6 text-primary" />,
        href: "/generate/text?textType=Product Description&topic=A new model of noise-cancelling headphones&length=short&style=humorous&count=5"
    }
];


export default function MarketplacePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Public Library & Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Discover, share, and remix datasets. A community-driven resource to accelerate your projects.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Star className="w-6 h-6 text-amber-500" /> Top Prompts</h2>
        <p className="text-muted-foreground">
          Kickstart your project with these popular, ready-to-use dataset prompts.
        </p>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {topPrompts.map((template) => (
            <Card key={template.title} className="flex flex-col">
              <CardHeader className="flex-row items-start gap-4 space-y-0">
                {template.icon}
                <div>
                  <CardTitle>{template.title}</CardTitle>
                  <CardDescription className="mt-1">{template.description}</CardDescription>
                </div>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Button asChild className="w-full">
                  <Link href={template.href}>Use Prompt</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Pre-built Schemas</h2>
        <p className="text-muted-foreground">
          Start with a structured foundation. Click a schema to pre-fill the Structured Data generator.
        </p>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {prebuiltSchemas.map((schema) => (
            <Card key={schema.title} className="flex flex-col">
              <CardHeader className="flex-row items-start gap-4 space-y-0">
                {schema.icon}
                <div>
                  <CardTitle>{schema.title}</CardTitle>
                  <CardDescription className="mt-1">{schema.description}</CardDescription>
                </div>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Button asChild className="w-full">
                  <Link href={schema.href}>Use Schema</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Text Generation Templates</h2>
        <p className="text-muted-foreground">
          Generate realistic, non-tabular text for NLP models and UI testing.
        </p>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {textTemplates.map((template) => (
            <Card key={template.title} className="flex flex-col">
              <CardHeader className="flex-row items-start gap-4 space-y-0">
                {template.icon}
                <div>
                  <CardTitle>{template.title}</CardTitle>
                  <CardDescription className="mt-1">{template.description}</CardDescription>
                </div>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Button asChild className="w-full">
                  <Link href={template.href}>Use Template</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Feature Coming Soon</CardTitle>
            <CardDescription>
              The ability to share your own datasets and prompts with the community is under construction. Stay tuned!
            </CardDescription>
          </CardHeader>
      </Card>

    </div>
  )
}
