import { AchievedImprovement, AlloyData } from "@/types/alloy";
import { CheckCircle2, Loader2, Clock, TrendingUp, MessageCircle, Send, IndianRupee, CheckCircle, XCircle, AlertCircle, FileDown, Thermometer } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { calculateCompositionCostFromObject } from "@/lib/elementPrices";
import { PropertyAnalysis } from "@/components/PropertyAnalysis";

export const ResultsDisplay = ({ result, isLoading, inputData }: ResultsDisplayProps) => {
  const { toast } = useToast();
  const [userQuestion, setUserQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [isAskingAI, setIsAskingAI] = useState(false);

  // DATA EXTRACTION FROM NESTED STRUCTURE
  const apiData = result?.data;
  const alloy = apiData?.redesigned_alloy; // The "Mega-Object"
  const composition = alloy?.new_composition || {};
  const properties = alloy?.predicted_properties || {};
  const heatTreatment = alloy?.heat_treatment_cycle;
  const improvements = alloy?.achieved_improvements || [];
  const summary = alloy?.analysis_summary;

  if (!result) return <div className="p-8 text-center">Ready to Analyze</div>;

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
          <CardTitle className="text-2xl font-bold">{alloy?.name || "Redesigned Alloy"}</CardTitle>
        </CardHeader>
      </Card>

      {/* 2. Composition & Cost Section */}
      <Card className="shadow-md">
        <CardHeader><CardTitle className="text-lg">Redesigned Composition</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(composition).map(([el, val]) => (
              <div key={el} className="p-2 border rounded bg-muted/30">
                <span className="font-bold">{el}:</span> {val}%
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-primary/5 rounded-lg border flex justify-between items-center">
            <div className="flex items-center gap-2"><IndianRupee className="w-5 h-5"/> <span>Est. Cost per kg</span></div>
            <span className="text-xl font-bold">₹{alloy?.estimated_cost_per_kg?.toFixed(2) || "N/A"}</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Heat Treatment Section */}
      {heatTreatment && (
        <Card className="shadow-md border-orange-200">
          <CardHeader className="bg-orange-50">
            <CardTitle className="text-lg flex items-center gap-2"><Thermometer className="w-5 h-5"/> Process Cycle: {heatTreatment.type}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-2 border-l-4 border-orange-400 bg-muted/20">
                <p className="text-xs uppercase text-muted-foreground">Temperature</p>
                <p className="font-bold">{heatTreatment.austenitizing_temp}</p>
              </div>
              <div className="p-2 border-l-4 border-orange-400 bg-muted/20">
                <p className="text-xs uppercase text-muted-foreground">Soaking Time</p>
                <p className="font-bold">{heatTreatment.soaking_time}</p>
              </div>
              <div className="p-2 border-l-4 border-orange-400 bg-muted/20">
                <p className="text-xs uppercase text-muted-foreground">Cooling</p>
                <p className="font-bold">{heatTreatment.quenching_medium} ({heatTreatment.cooling_rate})</p>
              </div>
            </div>
            <div className="p-3 bg-muted rounded text-sm italic">
              <strong>Microstructure:</strong> {heatTreatment.predicted_microstructure}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Properties & Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">Predicted Properties</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(properties).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b py-1">
                <span className="capitalize">{k.replace(/_/g, ' ')}</span>
                <span className="font-bold">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5">
          <CardHeader><CardTitle className="text-lg">Analysis Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{summary?.performance_gain_percent}%</p>
                <p className="text-xs">Strength Gain</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{summary?.cost_change_percent}%</p>
                <p className="text-xs">Cost Impact</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed">{summary?.remarks}</p>
          </CardContent>
        </Card>
      </div>

      {/* 5. Charts (Passing the whole result for Ashby/TTT extraction) */}
      <div id="property-analysis-charts">
        <PropertyAnalysis result={result} inputData={inputData} />
      </div>
    </div>
  );
};
