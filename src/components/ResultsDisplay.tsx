import { useState, useRef, useEffect } from "react";

import { 
  IndianRupee, 
  Thermometer, 
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Leaf, 
  Target, 
  Beaker, 
  Gauge,
  Microscope,
  Download,
  Flame,
  Droplets,
  Clock,
  Zap,
  Shield,
  MessageCircle,
  Send,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PropertyAnalysis } from "@/components/PropertyAnalysis";
import { AlloyData } from "@/types/alloy";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ResultsDisplayProps {
  result: any;
  isLoading?: boolean;
  inputData?: AlloyData;
}

// Metallurgy quotes for loading state
const metallurgyQuotes = [
  "\"Steel is the soul of modern civilization.\" — Andrew Carnegie",
  "\"Metallurgy is the art of fire and transformation.\" — Ancient Proverb",
  "\"The strength of a metal lies in its atomic bonds.\" — Materials Science Wisdom",
  "\"Every alloy tells a story of elements working in harmony.\" — Unknown Metallurgist",
  "\"Heat treatment is the sculptor's chisel for metals.\" — Industry Saying",
  "\"In the forge, chaos becomes order.\" — Traditional Blacksmith",
  "\"Understanding phase diagrams unlocks material potential.\" — Dr. William Hume-Rothery",
  "\"A good alloy is like a symphony — every element plays its part.\" — Modern Metallurgy"
];

// Staggered animation delay helper
const getAnimationDelay = (index: number, baseDelay: number = 100) => ({
  animationDelay: `${index * baseDelay}ms`,
  animationFillMode: 'both' as const
});

export const ResultsDisplay = ({ result, isLoading, inputData }: ResultsDisplayProps) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfMode, setIsPdfMode] = useState(false);
  
  // Chat state
  const [question, setQuestion] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [currentQuote, setCurrentQuote] = useState(0);

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

  // Rotate quotes during loading
  useEffect(() => {
    if (!isAskingQuestion) return;
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % metallurgyQuotes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAskingQuestion]);

  // High-Resolution PDF Export Handler with proper data hydration
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    setIsPdfMode(true);

    // Wait for DOM to fully render with PDF mode styles
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Ensure all images and content are loaded
      await Promise.all([
        document.fonts.ready,
        ...Array.from(reportRef.current.querySelectorAll('img')).map(
          img => img.complete ? Promise.resolve() : new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          })
        )
      ]);

      // Additional delay for charts to render
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(reportRef.current, {
        scale: 3, // 3x resolution for sharp printing
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        removeContainer: true,
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      // Handle multi-page PDF if content is too long
      const pageHeight = pdfHeight;
      const totalHeight = (imgHeight * ratio);
      let heightLeft = totalHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${name.replace(/\s+/g, '_')}_Technical_Report.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsPdfMode(false);
      setIsExporting(false);
    }
  };

  // Handle asking question about results
  const handleAskQuestion = async () => {
    if (!question.trim() || !result) return;
    
    setIsAskingQuestion(true);
    setChatResponse(null);
    
    try {
      const response = await fetch('https://tejanaidu5.app.n8n.cloud/webhook/ask-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          results_data: result,
          alloy_name: name,
          composition,
          properties,
          heat_treatment: heatTreatment,
          improvements,
          analysis_summary: summary,
          estimated_cost: estimatedCost,
          sustainability_score: sustainabilityScore,
          probability_of_success: probabilityOfSuccess
        }),
      });

      const data = await response.json();
      
      // Parse JSON response - handle various formats
      if (typeof data === 'string') {
        setChatResponse(data);
      } else if (data.answer) {
        setChatResponse(data.answer);
      } else if (data.response) {
        setChatResponse(data.response);
      } else if (data.message) {
        setChatResponse(data.message);
      } else if (data.text) {
        setChatResponse(data.text);
      } else {
        setChatResponse(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('Failed to ask question:', error);
      setChatResponse('Sorry, there was an error processing your question. Please try again.');
    } finally {
      setIsAskingQuestion(false);
    }
  };

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
      case "exceeded":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "partially achieved":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "not achieved":
      case "failed":
      case "not met":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // Element symbol extraction (first 1-2 letters uppercase)
  const getElementSymbol = (element: string) => {
    const symbol = element.charAt(0).toUpperCase() + (element.charAt(1)?.toLowerCase() || '');
    return symbol;
  };

  // PDF mode classes - disable animations and ensure high visibility
  const pdfModeClasses = isPdfMode ? 'pdf-export-mode' : '';
  const cardAnimationClass = isPdfMode ? '' : 'animate-in fade-in-0 slide-in-from-top-4 duration-700';
  const slideAnimationClass = isPdfMode ? '' : 'animate-in fade-in-0 slide-in-from-bottom-4 duration-700';

  return (
    <div className={`space-y-8 ${pdfModeClasses}`}>
      {/* PDF Export Styles - Injected when exporting */}
      {isPdfMode && (
        <style>{`
          .pdf-export-mode * {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
            animation-delay: 0s !important;
          }
          .pdf-export-mode .animate-in {
            animation: none !important;
          }
          .pdf-export-mode [class*="fade-in"],
          .pdf-export-mode [class*="slide-in"],
          .pdf-export-mode [class*="zoom-in"] {
            opacity: 1 !important;
            transform: none !important;
          }
        `}</style>
      )}

      <div ref={reportRef} className="space-y-8 bg-white p-4">
        {/* ====== SECTION 1: Success Score Progress Bars (TL;DR) ====== */}
        <div 
          className={cardAnimationClass}
          style={isPdfMode ? {} : getAnimationDelay(0, 0)}
        >
          <Card className="shadow-xl border-border/50 overflow-hidden bg-gradient-to-br from-card via-card to-muted/20">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg" style={{ opacity: 1 }}>
                    <Beaker className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{name}</h2>
                    <p className="text-sm text-muted-foreground">Metallurgical Redesign Analysis</p>
                  </div>
                </div>
                
                {/* PDF Export Button - Hidden during export */}
                {!isPdfMode && (
                  <Button 
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    variant="outline"
                    className="gap-2 border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300"
                  >
                    <Download className="w-4 h-4" />
                    {isExporting ? "Generating..." : "Download Technical Report"}
                  </Button>
                )}
              </div>

              {/* Success Score Progress Bars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Probability of Success */}
                {probabilityOfSuccess !== undefined && (
                  <div className="space-y-2" style={{ opacity: 1 }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-muted-foreground">Success Probability</span>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {(probabilityOfSuccess * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r from-primary to-accent rounded-full ${isPdfMode ? '' : 'transition-all duration-1000 ease-out'}`}
                        style={{ width: `${probabilityOfSuccess * 100}%`, opacity: 1 }}
                      />
                    </div>
                  </div>
                )}

                {/* Sustainability Score */}
                {sustainabilityScore !== undefined && (
                  <div className="space-y-2" style={{ opacity: 1 }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-muted-foreground">Sustainability Score</span>
                      </div>
                      <span className="text-lg font-bold text-green-500">
                        {(sustainabilityScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full ${isPdfMode ? '' : 'transition-all duration-1000 ease-out'}`}
                        style={{ width: `${sustainabilityScore * 100}%`, opacity: 1 }}
                      />
                    </div>
                  </div>
                )}

                {/* Estimated Cost */}
                {estimatedCost !== undefined && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20" style={{ opacity: 1 }}>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Cost per kg</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      ₹{estimatedCost.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ====== SECTION 2: Periodic Table Composition Grid ====== */}
        <div 
          className={slideAnimationClass}
          style={isPdfMode ? {} : getAnimationDelay(1, 150)}
        >
          <Card className="shadow-xl border-border/50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-b border-border/50">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center" style={{ opacity: 1 }}>
                  <Beaker className="w-5 h-5 text-primary" />
                </div>
                Redesigned Composition
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {Object.entries(composition).map(([element, value], index) => (
                  <div
                    key={element}
                    className={`group relative ${isPdfMode ? '' : 'animate-in fade-in-0 zoom-in-95 duration-500'}`}
                    style={isPdfMode ? { opacity: 1 } : getAnimationDelay(index, 50)}
                  >
                    {/* Glass-morphism tile */}
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/50 backdrop-blur-sm p-3 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 hover:scale-105 group-hover:bg-gradient-to-br group-hover:from-primary/5 group-hover:to-accent/5" style={{ opacity: 1, zIndex: 10 }}>
                      {/* Element Symbol - Bold Scientific Font */}
                      <span className="text-2xl font-bold text-foreground tracking-tight font-mono">
                        {getElementSymbol(element)}
                      </span>
                      {/* Full Name */}
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                        {element}
                      </span>
                      {/* Percentage */}
                      <span className="text-sm font-semibold text-primary mt-1">
                        {typeof value === 'number' ? value.toFixed(2) : String(value)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ====== SECTION 3: Heat Treatment Vault (Warm Orange Theme) ====== */}
        {heatTreatment && (
          <div 
            className={slideAnimationClass}
            style={isPdfMode ? {} : getAnimationDelay(2, 150)}
          >
            <Card className="shadow-xl border-border/50 overflow-hidden relative">
              {/* Subtle warm glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5 pointer-events-none" />
              
              <CardHeader className="bg-gradient-to-r from-orange-500/15 via-orange-500/10 to-amber-500/15 border-b border-orange-500/20 relative">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25" style={{ opacity: 1 }}>
                    <Thermometer className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-foreground">Heat Treatment Vault</span>
                    <span className="ml-3 px-3 py-1 text-sm font-bold rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white" style={{ opacity: 1 }}>
                      {heatTreatment.type}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-6 pb-6 relative">
                {/* Primary Heat Treatment Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div 
                    className={`p-5 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-l-4 border-orange-500 ${isPdfMode ? '' : 'transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10'}`}
                    style={{ opacity: 1 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Austenitizing Temp</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{heatTreatment.austenitizing_temp}</p>
                  </div>
                  
                  <div 
                    className={`p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-l-4 border-amber-500 ${isPdfMode ? '' : 'transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10'}`}
                    style={{ opacity: 1 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Soaking Time</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{heatTreatment.soaking_time}</p>
                  </div>
                  
                  <div 
                    className={`p-5 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border-l-4 border-red-500 ${isPdfMode ? '' : 'transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10'}`}
                    style={{ opacity: 1 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="w-4 h-4 text-red-500" />
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Quenching</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="px-2 py-1 text-sm font-semibold rounded-md bg-red-500/20 text-red-600 dark:text-red-400" style={{ opacity: 1 }}>
                        {heatTreatment.quenching_medium}
                      </span>
                      <span className="px-2 py-1 text-sm font-semibold rounded-md bg-orange-500/20 text-orange-600 dark:text-orange-400" style={{ opacity: 1 }}>
                        {heatTreatment.cooling_rate}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Tempering Stage */}
                {heatTreatment.tempering_stage && (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50 mb-4" style={{ opacity: 1 }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Tempering Stage</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Required:</span>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${heatTreatment.tempering_stage.required ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'}`} style={{ opacity: 1 }}>
                          {heatTreatment.tempering_stage.required ? "Yes" : "No"}
                        </span>
                      </div>
                      {heatTreatment.tempering_stage.temp !== "N/A" && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Temp:</span>
                            <span className="font-semibold text-foreground">{heatTreatment.tempering_stage.temp}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Time:</span>
                            <span className="font-semibold text-foreground">{heatTreatment.tempering_stage.time}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Predicted Microstructure */}
                {heatTreatment.predicted_microstructure && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20" style={{ opacity: 1 }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-orange-500" />
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Predicted Microstructure</p>
                    </div>
                    <p className="text-sm leading-relaxed font-medium text-foreground">{heatTreatment.predicted_microstructure}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ====== SECTION 4: Property Matrix (Cool Blue Theme) ====== */}
        <div 
          className={slideAnimationClass}
          style={isPdfMode ? {} : getAnimationDelay(3, 150)}
        >
          <Card className="shadow-xl border-border/50 overflow-hidden relative">
            {/* Subtle cool glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
            
            <CardHeader className="bg-gradient-to-r from-blue-500/15 via-primary/10 to-cyan-500/15 border-b border-primary/20 relative">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25" style={{ opacity: 1 }}>
                  <Gauge className="w-5 h-5 text-white" />
                </div>
                Property Matrix
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-6 pb-6 relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(properties).map(([key, value], index) => (
                  <div
                    key={key}
                    className={`p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 ${isPdfMode ? '' : 'transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/40'}`}
                    style={{ opacity: 1, zIndex: 10 }}
                  >
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ====== SECTION 5: Achieved Improvements ====== */}
        {improvements.length > 0 && (
          <div 
            className={slideAnimationClass}
            style={isPdfMode ? {} : getAnimationDelay(4, 150)}
          >
            <Card className="shadow-xl border-border/50 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
              
              <CardHeader className="bg-gradient-to-r from-green-500/15 via-green-500/10 to-emerald-500/15 border-b border-green-500/20 relative">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25" style={{ opacity: 1 }}>
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  Performance Improvements
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-6 pb-6 relative">
                <div className="space-y-3">
                  {improvements.map((imp: any, index: number) => (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 ${isPdfMode ? '' : 'transition-all duration-300 hover:shadow-md hover:bg-muted/50'}`}
                      style={{ opacity: 1 }}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center" style={{ opacity: 1 }}>
                        {getStatusIcon(imp.status)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{imp.goal_name}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                          <span>Target: <span className="text-foreground font-medium">{imp.target_value}</span></span>
                          <span>Achieved: <span className="text-primary font-bold">{imp.achieved_value}</span></span>
                        </div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                        imp.status?.toLowerCase() === "achieved" || imp.status?.toLowerCase() === "exceeded"
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25" 
                          : imp.status?.toLowerCase() === "partially achieved"
                          ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/25"
                          : "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25"
                      }`} style={{ opacity: 1 }}>
                        {imp.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ====== SECTION 6: Analysis Insights Card ====== */}
        {summary && Object.keys(summary).length > 0 && (
          <div 
            className={slideAnimationClass}
            style={isPdfMode ? {} : getAnimationDelay(5, 150)}
          >
            <Card className="shadow-xl border-border/50 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-b border-border/50">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25" style={{ opacity: 1 }}>
                    <Microscope className="w-5 h-5 text-white" />
                  </div>
                  Metallurgical Insights
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-6 pb-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {summary.performance_gain_percent !== undefined && (
                    <div className={`p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-center ${isPdfMode ? '' : 'transition-all duration-300 hover:shadow-lg hover:shadow-primary/15'}`} style={{ opacity: 1 }}>
                      <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {summary.performance_gain_percent}%
                      </p>
                      <p className="text-sm text-muted-foreground mt-2 font-medium uppercase tracking-wide">Performance Gain</p>
                    </div>
                  )}
                  {summary.cost_change_percent !== undefined && (
                    <div 
                      className={`p-5 rounded-xl border text-center ${isPdfMode ? '' : 'transition-all duration-300 hover:shadow-lg'} ${
                        summary.cost_change_percent > 0 
                          ? 'bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20' 
                          : 'bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20'
                      }`}
                      style={{ opacity: 1 }}
                    >
                      <p className={`text-4xl font-bold ${summary.cost_change_percent > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                        {summary.cost_change_percent > 0 ? '+' : ''}{summary.cost_change_percent}%
                      </p>
                      <p className="text-sm text-muted-foreground mt-2 font-medium uppercase tracking-wide">Cost Change</p>
                    </div>
                  )}
                  {summary.environmental_impact_change !== undefined && (
                    <div 
                      className={`p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 text-center ${isPdfMode ? '' : 'transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/15'}`}
                      style={{ opacity: 1 }}
                    >
                      <p className="text-4xl font-bold text-emerald-500">{summary.environmental_impact_change}</p>
                      <p className="text-sm text-muted-foreground mt-2 font-medium uppercase tracking-wide">Environmental Impact</p>
                    </div>
                  )}
                </div>

                {/* Expert Remarks */}
                {summary.remarks && (
                  <div className="p-6 rounded-xl bg-muted/30 border border-border/50" style={{ opacity: 1, zIndex: 10 }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Microscope className="w-5 h-5 text-primary" />
                      <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">Expert Analysis</p>
                    </div>
                    <p className="text-base leading-relaxed text-foreground/90 font-light tracking-wide" style={{ lineHeight: '1.8' }}>
                      {summary.remarks}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ====== SECTION 7: Interactive Charts (Ashby & TTT) ====== */}
        <div 
          className={slideAnimationClass}
          style={isPdfMode ? {} : getAnimationDelay(6, 150)}
          id="property-analysis-charts"
        >
          <PropertyAnalysis result={result} inputData={inputData} />
        </div>
      </div>

      {/* ====== SECTION 8: Ask a Question Chat Box ====== */}
      <div 
        className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 mt-8"
        style={getAnimationDelay(7, 150)}
      >
        <Card className="shadow-xl border-border/50 overflow-hidden relative">
          {/* Glowing background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          
          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-b border-border/50 relative">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 animate-pulse-slow">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              Ask About Your Results
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6 pb-6 relative">
            {/* Chat Response Display */}
            {(chatResponse || isAskingQuestion) && (
              <div className="mb-6 p-6 rounded-xl bg-muted/30 border border-border/50 animate-in fade-in-0 slide-in-from-top-4 duration-500">
                {isAskingQuestion ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-6">
                    {/* Animated Timer */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                      <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-pulse" />
                    </div>
                    
                    {/* Metallurgy Quote */}
                    <div className="text-center max-w-md animate-in fade-in-0 duration-500">
                      <p className="text-sm italic text-muted-foreground leading-relaxed">
                        {metallurgyQuotes[currentQuote]}
                      </p>
                    </div>
                    
                    <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">
                      Analyzing your question...
                    </p>
                  </div>
                ) : (
                  <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Beaker className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">AI Response</p>
                    </div>
                    <p className="text-base leading-relaxed text-foreground/90 font-light tracking-wide whitespace-pre-wrap" style={{ lineHeight: '1.8' }}>
                      {chatResponse}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Question Input */}
            <div className="space-y-4">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask any question about the redesigned alloy, heat treatment process, or metallurgical properties..."
                className="min-h-[100px] resize-none border-border/50 focus:border-primary/50 bg-background/50"
                disabled={isAskingQuestion}
              />
              
              {/* Glowing Animated Ask Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleAskQuestion}
                  disabled={!question.trim() || isAskingQuestion}
                  className="relative group px-8 py-6 text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {/* Glowing animation ring */}
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                  <span className="absolute inset-0 rounded-xl animate-glow opacity-50" />
                  
                  <span className="relative flex items-center gap-3">
                    {isAskingQuestion ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Ask a Question
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
