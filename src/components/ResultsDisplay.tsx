import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlloyResult } from "@/types/alloy";
import { CheckCircle2, TrendingUp, DollarSign, Leaf, Loader2 } from "lucide-react";

interface ResultsDisplayProps {
  result: AlloyResult | null;
  isLoading: boolean;
}

export const ResultsDisplay = ({ result, isLoading }: ResultsDisplayProps) => {
  if (isLoading) {
    return (
      <Card className="shadow-lg border-border/50 flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Analyzing alloy composition...</p>
        </div>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="shadow-lg border-border/50 flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-2 p-8">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">Ready to Analyze</h3>
          <p className="text-muted-foreground max-w-sm">
            Enter your alloy specifications and click "Redesign Alloy" to see optimized results
          </p>
        </div>
      </Card>
    );
  }

  // Defensive check for required data
  if (!result.redesigned_alloy || !result.analysis_summary) {
    return (
      <Card className="shadow-lg border-border/50 flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-2 p-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold text-destructive">Invalid Response</h3>
          <p className="text-muted-foreground max-w-sm">
            The API returned an unexpected response format. Please try again or check your webhook configuration.
          </p>
        </div>
      </Card>
    );
  }

  const { redesigned_alloy, analysis_summary } = result;

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="bg-gradient-to-r from-success/5 to-accent/5 border-b">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-success" />
          Redesigned Alloy Results
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Alloy Name */}
        <div>
          <h3 className="text-2xl font-bold text-primary">{redesigned_alloy.name}</h3>
          <Badge variant="secondary" className="mt-2">
            Status: {result.status}
          </Badge>
        </div>

        <Separator />

        {/* New Composition */}
        <div>
          <h4 className="font-semibold mb-3 text-steel-dark">New Composition</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(redesigned_alloy.new_composition).map(([element, value]) => (
              <div
                key={element}
                className="bg-secondary rounded-lg p-3 text-center border border-border/50"
              >
                <div className="font-bold text-primary">{element}</div>
                <div className="text-sm text-muted-foreground">{value}%</div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Predicted Properties */}
        <div>
          <h4 className="font-semibold mb-3 text-steel-dark">Predicted Properties</h4>
          <div className="space-y-2">
            {Object.entries(redesigned_alloy.predicted_properties).map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-center p-2 rounded bg-muted/50"
              >
                <span className="text-sm capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Cost per kg</span>
            </div>
            <div className="text-2xl font-bold">${redesigned_alloy.estimated_cost_per_kg}</div>
            <Badge variant="outline" className="mt-2">
              {analysis_summary.cost_change_percent > 0 ? "+" : ""}
              {analysis_summary.cost_change_percent}%
            </Badge>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm text-muted-foreground">Performance</span>
            </div>
            <div className="text-2xl font-bold">
              +{analysis_summary.performance_gain_percent}%
            </div>
            <Badge variant="outline" className="mt-2 border-success text-success">
              Improved
            </Badge>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-success" />
              <span className="text-sm text-muted-foreground">Sustainability</span>
            </div>
            <div className="text-2xl font-bold">
              {(redesigned_alloy.sustainability_score * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Success Rate</span>
            </div>
            <div className="text-2xl font-bold">
              {(redesigned_alloy.probability_of_success * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        {analysis_summary.remarks && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2 text-steel-dark">Analysis Summary</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis_summary.remarks}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
