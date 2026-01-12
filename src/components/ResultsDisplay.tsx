import { AchievedImprovement, AlloyData } from "@/types/alloy";
import { CheckCircle2, Loader2, Clock, TrendingUp, MessageCircle, Send, IndianRupee, CheckCircle, XCircle, AlertCircle, FileDown } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { calculateCompositionCostFromObject } from "@/lib/elementPrices";
import { PropertyAnalysis } from "@/components/PropertyAnalysis";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResult = any;

interface ResultsDisplayProps {
  result: ApiResult;
  isLoading: boolean;
  inputData?: AlloyData | null;
}

export const ResultsDisplay = ({ result, isLoading, inputData }: ResultsDisplayProps) => {
  const { toast } = useToast();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [userQuestion, setUserQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // --- DATA EXTRACTION LOGIC ---
  const apiData = result?.data;
  const redesigned_alloy = apiData?.redesigned_alloy;
  const analysis_summary = apiData?.analysis_summary || apiData?.summary;

  // Convert Composition Object to Array for the Table
  // Handles the "undefined" error by ensuring we have a list to map over
  const compositionRaw = redesigned_alloy?.new_composition || apiData?.composition || {};
  const compositionEntries = typeof compositionRaw === 'object' && !Array.isArray(compositionRaw)
    ? Object.entries(compositionRaw).map(([element, percentage]) => ({
        element,
        percentage: Number(percentage)
      }))
    : Array.isArray(compositionRaw) ? compositionRaw : [];

  // Extract Properties safely to avoid [object Object] display
  const propertiesRaw = redesigned_alloy?.predicted_properties || apiData?.properties || {};
  
  // Extract Achieved Improvements
  const achievedImprovements: AchievedImprovement[] = redesigned_alloy?.achieved_improvements || [];

  // Handle PDF Export
  const handleExportPDF = async () => {
    if (!result || !resultsRef.current) {
      toast({
        title: "Cannot Export",
        description: "No results available to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let yPosition = 20;

      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("Technical Alloy Redesign Report", margin, yPosition);
      yPosition += 15;

      const alloyName = redesigned_alloy?.name || "Redesigned Alloy";
      pdf.setFontSize(16);
      pdf.text(`Alloy: ${alloyName}`, margin, yPosition);
      yPosition += 12;

      // Composition Table in PDF
      pdf.setFontSize(12);
      pdf.text("Composition (%)", margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      compositionEntries.forEach((item) => {
        pdf.text(`${item.element}:`, margin + 5, yPosition);
        pdf.text(`${item.percentage.toFixed(2)}%`, margin + 50, yPosition);
        yPosition += 6;
      });

      yPosition += 10;
      pdf.setFont("helvetica", "bold");
      pdf.text("Predicted Properties", margin, yPosition);
      yPosition += 8;
      pdf.setFont("helvetica", "normal");

      Object.entries(propertiesRaw).forEach(([key, value]) => {
        const label = key.replace(/_/g, ' ').toUpperCase();
        pdf.text(`${label}:`, margin + 5, yPosition);
        pdf.text(`${String(value)}`, margin + 60, yPosition);
        yPosition += 6;
      });

      pdf.save(`Alloy_Report_${alloyName}.pdf`);
      
      toast({ title: "Report Downloaded" });
    } catch (error) {
      console.error("PDF Error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAskAI = async () => {
    if (!userQuestion.trim() || !result) return;
    setIsAskingAI(true);
    try {
      const response = await fetch("https://tejanaidu5.app.n8n.cloud/webhook/ask-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userQuestion: userQuestion.trim(), fullResultContext: result }),
      });
      const data = await response.json();
      setAiAnswer(data.response || data.answer || JSON.stringify(data));
    } catch (error) {
      toast({ title: "AI Query Failed", variant: "destructive" });
    } finally {
      setIsAskingAI(false);
    }
  };

  if (!result) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-2 p-8">
          <CheckCircle2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Ready to Analyze</h3>
          <p className="text-muted-foreground">Enter specifications and click "Redesign Alloy"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={resultsRef}>
      <Card className="shadow-lg border-border/50">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {redesigned_alloy?.name || "Redesigned Alloy"}
            </CardTitle>
            <Button onClick={handleExportPDF} disabled={isExporting} variant="outline" className="gap-2">
              {isExporting ? <Loader2 className="animate-spin w-4 h-4" /> : <FileDown className="w-4 h-4" />}
              Download Technical Report
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Composition Table - Fixed "undefined" by using compositionEntries */}
      <Card className="shadow-lg border-border/50">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="text-lg">New Composition (%)</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-2">
            {compositionEntries.map((item) => (
              <div key={item.element} className="flex gap-2">
                <div className="w-1/3 px-3 py-2 rounded-md border bg-muted/30 text-sm font-bold">
                  {item.element}
                </div>
                <div className="flex-1 px-3 py-2 rounded-md border text-sm font-medium">
                  {item.percentage.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <IndianRupee className="w-5 h-5" /> Estimated Cost / kg
            </div>
            <span className="text-2xl font-bold text-primary">
              ₹{redesigned_alloy?.estimated_cost_per_kg || calculateCompositionCostFromObject(compositionRaw).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Property Cards - Fixed [object Object] by mapping propertiesRaw */}
      <Card className="shadow-lg border-border/50">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="text-lg">Predicted Properties</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(propertiesRaw).map(([key, value]) => (
              <div key={key} className="p-4 rounded-lg border bg-card shadow-sm">
                <div className="text-xs font-bold text-muted-foreground uppercase mb-1">
                  {key.replace(/_/g, " ")}
                </div>
                <div className="text-2xl font-bold">
                  {String(value)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metallurgical Insights */}
      {analysis_summary?.remarks && (
        <Card className="shadow-lg border-border/50">
          <CardHeader className="bg-accent/5 border-b">
            <CardTitle className="text-lg">Metallurgical Insights</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{analysis_summary.remarks}</p>
          </CardContent>
        </Card>
      )}

      <div id="property-analysis-charts">
        <PropertyAnalysis result={result} inputData={inputData} />
      </div>
    </div>
  );
};
