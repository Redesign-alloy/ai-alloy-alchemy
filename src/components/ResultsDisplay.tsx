import { IndianRupee, Thermometer, TrendingUp, Activity, CheckCircle2, XCircle, AlertCircle, Leaf, Target, Beaker, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyAnalysis } from "@/components/PropertyAnalysis";
import { AlloyData } from "@/types/alloy";

interface ResultsDisplayProps {
  result: any;
  isLoading?: boolean;
  inputData?: AlloyData;
}

export const ResultsDisplay = ({ result, isLoading, inputData }: ResultsDisplayProps) => {
  // Handle both nested (result.data.redesigned_alloy) and flat (result.data) structures
  const apiData = result?.data;
  const alloy = apiData?.redesigned_alloy || apiData;
  
  // Extract all data from the webhook response
  const name = alloy?.name || "Redesigned Alloy";
  const composition = alloy?.new_composition || {};
  const properties = alloy?.predicted_properties || {};
  const heatTreatment = alloy?.heat_treatment_cycle;
  const improvements = alloy?.achieved_improvements || [];
  const summary = alloy?.analysis_summary || {};
  const estimatedCost = alloy?.estimated_cost_per_kg;
  const sustainabilityScore = alloy?.sustainability_score;
  const probabilityOfSuccess = alloy?.probability_of_success;
  const chartData = alloy?.chart_data;
  const visuals = alloy?.visuals;

  if (!result) {
    return (
      <Card className="shadow-lg border-border/50 h-full flex items-center justify-center">
        <CardContent className="text-center py-16">
          <Beaker className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Ready to Analyze</p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            Configure your alloy parameters and click "Redesign Alloy"
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "achieved":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "partially achieved":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "not achieved":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header Section - Matches AlloyForm Header Style */}
      <Card className="shadow-lg border-border/50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Beaker className="w-6 h-6 text-primary" />
            {name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Probability of Success */}
            {probabilityOfSuccess !== undefined && (
              <div className="p-4 bg-muted/50 rounded-lg border border-border/50 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Success Probability</span>
                </div>
                <span className="text-2xl font-bold text-primary">
                  {(probabilityOfSuccess * 100).toFixed(0)}%
                </span>
              </div>
            )}
            {/* Sustainability Score */}
            {sustainabilityScore !== undefined && (
              <div className="p-4 bg-muted/50 rounded-lg border border-border/50 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Sustainability</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {(sustainabilityScore * 100).toFixed(0)}%
                </span>
              </div>
            )}
            {/* Estimated Cost */}
            {estimatedCost !== undefined && (
              <div className="p-4 bg-muted/50 rounded-lg border border-border/50 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupee className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Cost per kg</span>
                </div>
                <span className="text-2xl font-bold text-primary">
                  ₹{estimatedCost.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Redesigned Composition - Matching Input Form Style */}
      <Card className="shadow-lg border-border/50">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="flex items-center gap-2">
            <Beaker className="w-5 h-5 text-primary" />
            Redesigned Composition (%)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {Object.entries(composition).map(([element, value], index) => (
              <div
                key={element}
                className="flex gap-2 animate-in slide-in-from-left-5 duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-1/3 px-3 py-2 bg-muted/50 rounded-lg border border-border/50 font-medium">
                  {element}
                </div>
                <div className="flex-1 px-3 py-2 bg-muted/50 rounded-lg border border-border/50 text-right font-semibold text-primary">
                  {typeof value === 'number' ? value.toFixed(2) : String(value)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heat Treatment Cycle */}
      {heatTreatment && (
        <Card className="shadow-lg border-border/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-orange-500" />
              Heat Treatment: {heatTreatment.type}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-orange-400 transition-all hover:shadow-md animate-in slide-in-from-bottom-5 duration-300">
                <p className="text-xs uppercase text-muted-foreground mb-1">Austenitizing Temperature</p>
                <p className="font-bold text-lg">{heatTreatment.austenitizing_temp}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-orange-400 transition-all hover:shadow-md animate-in slide-in-from-bottom-5 duration-300" style={{ animationDelay: "100ms" }}>
                <p className="text-xs uppercase text-muted-foreground mb-1">Soaking Time</p>
                <p className="font-bold text-lg">{heatTreatment.soaking_time}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-orange-400 transition-all hover:shadow-md animate-in slide-in-from-bottom-5 duration-300" style={{ animationDelay: "200ms" }}>
                <p className="text-xs uppercase text-muted-foreground mb-1">Quenching</p>
                <p className="font-bold text-lg">{heatTreatment.quenching_medium} ({heatTreatment.cooling_rate})</p>
              </div>
            </div>
            
            {/* Tempering Stage */}
            {heatTreatment.tempering_stage && (
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50 mb-4 animate-in fade-in-50 duration-500">
                <p className="text-xs uppercase text-muted-foreground mb-2">Tempering Stage</p>
                <div className="flex gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Required: </span>
                    <span className="font-medium">{heatTreatment.tempering_stage.required ? "Yes" : "No"}</span>
                  </div>
                  {heatTreatment.tempering_stage.temp !== "N/A" && (
                    <>
                      <div>
                        <span className="text-sm text-muted-foreground">Temp: </span>
                        <span className="font-medium">{heatTreatment.tempering_stage.temp}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Time: </span>
                        <span className="font-medium">{heatTreatment.tempering_stage.time}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Microstructure */}
            {heatTreatment.predicted_microstructure && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 animate-in fade-in-50 duration-500">
                <p className="text-xs uppercase text-muted-foreground mb-1">Predicted Microstructure</p>
                <p className="text-sm leading-relaxed font-medium">{heatTreatment.predicted_microstructure}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Predicted Properties - Matching Input Form Style */}
      <Card className="shadow-lg border-border/50">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            Predicted Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {Object.entries(properties).map(([key, value], index) => (
              <div
                key={key}
                className="flex gap-2 animate-in slide-in-from-right-5 duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-1/2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50 capitalize">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="flex-1 px-3 py-2 bg-muted/50 rounded-lg border border-border/50 text-right font-semibold text-primary">
                  {String(value)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achieved Improvements */}
      {improvements.length > 0 && (
        <Card className="shadow-lg border-border/50">
          <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Achieved Improvements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {improvements.map((imp: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border/50 transition-all hover:shadow-md animate-in slide-in-from-left-5 duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {getStatusIcon(imp.status)}
                  <div className="flex-1">
                    <p className="font-medium">{imp.goal_name}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      <span>Target: <span className="text-foreground font-medium">{imp.target_value}</span></span>
                      <span>Achieved: <span className="text-primary font-bold">{imp.achieved_value}</span></span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    imp.status?.toLowerCase() === "achieved" 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                      : imp.status?.toLowerCase() === "partially achieved"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {imp.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Summary */}
      {summary && Object.keys(summary).length > 0 && (
        <Card className="shadow-lg border-border/50">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {summary.performance_gain_percent !== undefined && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 text-center transition-all hover:shadow-md animate-in zoom-in-50 duration-300">
                  <p className="text-3xl font-bold text-primary">{summary.performance_gain_percent}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Performance Gain</p>
                </div>
              )}
              {summary.cost_change_percent !== undefined && (
                <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20 text-center transition-all hover:shadow-md animate-in zoom-in-50 duration-300" style={{ animationDelay: "100ms" }}>
                  <p className={`text-3xl font-bold ${summary.cost_change_percent > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                    {summary.cost_change_percent > 0 ? '+' : ''}{summary.cost_change_percent}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Cost Change</p>
                </div>
              )}
              {summary.environmental_impact_change !== undefined && (
                <div className="p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20 text-center transition-all hover:shadow-md animate-in zoom-in-50 duration-300" style={{ animationDelay: "200ms" }}>
                  <p className="text-3xl font-bold text-emerald-600">{summary.environmental_impact_change}</p>
                  <p className="text-xs text-muted-foreground mt-1">Environmental Impact</p>
                </div>
              )}
            </div>

            {/* Remarks */}
            {summary.remarks && (
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50 animate-in fade-in-50 duration-500">
                <p className="text-xs uppercase text-muted-foreground mb-2">Detailed Analysis</p>
                <p className="text-sm leading-relaxed">{summary.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div id="property-analysis-charts">
        <PropertyAnalysis result={result} inputData={inputData} />
      </div>
    </div>
  );
};
