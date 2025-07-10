import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LifeBuoy } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground">
          Find answers to your questions.
        </p>
      </div>
      <Card className="mt-6">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <LifeBuoy />
                Feature Coming Soon
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">We're building a comprehensive help center. Please check back later!</p>
        </CardContent>
      </Card>
    </div>
  )
}
