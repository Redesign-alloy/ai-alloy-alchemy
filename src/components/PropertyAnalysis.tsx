import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell,
  ReferenceLine,
} from "recharts";
import { TrendingUp, Thermometer, Star } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResult = any;

interface PropertyAnalysisProps {
  result: ApiResult;
  inputData?: ApiResult;
}

interface PropertyOption {
  key: string;
  label: string;
  unit: string;
}

export const PropertyAnalysis = ({ result, inputData }: PropertyAnalysisProps) => {
  // Extract API data from new format
  const apiData = result?.data;
  const redesignResults = apiData?.redesign_results;
  const finalOutput = result?.final_output || result?.value?.[0]?.final_output || redesignResults;

  // Extract available properties dynamically from result and input
  const availableProperties = useMemo((): PropertyOption[] => {
    const properties: PropertyOption[] = [];
    const seenKeys = new Set<string>();
    
    // Get properties from new format
    const apiProperties = apiData?.properties || {};
    const predictedProps = finalOutput?.redesigned_alloy?.predicted_properties || {};
    const originalProps = inputData?.original_alloy?.properties || {};
    
    // Helper to add property if not seen
    const addProperty = (key: string, label: string, unit: string) => {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      if (!seenKeys.has(normalizedKey)) {
        seenKeys.add(normalizedKey);
        properties.push({ key: normalizedKey, label, unit });
      }
    };
    
    // Add standard properties
    addProperty("yield_strength", "Yield Strength", "MPa");
    addProperty("tensile_strength", "Tensile Strength", "MPa");
    addProperty("estimated_cost", "Estimated Cost", "$/kg");
    addProperty("density", "Density", "g/cm³");
    addProperty("youngs_modulus", "Young's Modulus", "GPa");
    addProperty("hardness", "Hardness", "HRC");
    addProperty("elongation", "Elongation", "%");
    addProperty("impact_toughness", "Impact Toughness", "J");
    
    // Add properties from API response
    Object.keys(apiProperties).forEach((key) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      addProperty(key, label, "");
    });
    
    // Add from predicted props
    Object.keys(predictedProps).forEach((key) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      addProperty(key, label, "");
    });
    
    // Add original properties if available
    if (originalProps.original_properties && Array.isArray(originalProps.original_properties)) {
      originalProps.original_properties.forEach((prop: any) => {
        if (prop.name) {
          addProperty(prop.name, prop.name, prop.unit || "");
        }
      });
    }
    
    return properties;
  }, [result, inputData, apiData, finalOutput]);

  const [xAxisProperty, setXAxisProperty] = useState<string>("yield_strength");
  const [yAxisProperty, setYAxisProperty] = useState<string>("estimated_cost");

  // Get axis labels and units
  const xAxisOption = availableProperties.find(p => p.key === xAxisProperty) || availableProperties[0];
  const yAxisOption = availableProperties.find(p => p.key === yAxisProperty) || availableProperties[1];

  // Extract chart data - prefer new format ashby_data
  const chartData = useMemo(() => {
    // Check for new format ashby_data
    if (apiData?.ashby_data && Array.isArray(apiData.ashby_data)) {
      return apiData.ashby_data.map((point: any) => ({
        ...point,
        [xAxisProperty]: point.x ?? point[xAxisProperty],
        [yAxisProperty]: point.y ?? point[yAxisProperty],
      }));
    }
    
    // Legacy format
    if (finalOutput?.chartData && Array.isArray(finalOutput.chartData)) {
      return finalOutput.chartData;
    }
    
    // Generate sample reference alloys with the redesigned alloy highlighted
    const referenceAlloys = [
      { name: "AISI 1020", yield_strength: 295, tensile_strength: 395, estimated_cost: 0.5, density: 7.87, youngs_modulus: 200, isRedesign: false },
      { name: "AISI 4140", yield_strength: 655, tensile_strength: 1020, estimated_cost: 0.8, density: 7.85, youngs_modulus: 210, isRedesign: false },
      { name: "AISI 4340", yield_strength: 860, tensile_strength: 1080, estimated_cost: 1.2, density: 7.85, youngs_modulus: 205, isRedesign: false },
      { name: "AISI 304", yield_strength: 215, tensile_strength: 505, estimated_cost: 2.5, density: 8.0, youngs_modulus: 193, isRedesign: false },
      { name: "Ti-6Al-4V", yield_strength: 880, tensile_strength: 950, estimated_cost: 15, density: 4.43, youngs_modulus: 114, isRedesign: false },
      { name: "Inconel 718", yield_strength: 1100, tensile_strength: 1375, estimated_cost: 25, density: 8.19, youngs_modulus: 211, isRedesign: false },
    ];
    
    // Add the redesigned alloy data if available
    const redesignedAlloy = finalOutput?.redesigned_alloy;
    if (redesignedAlloy) {
      const predictedProps = redesignedAlloy.predicted_properties || apiData?.properties || {};
      
      const redesignData: any = {
        name: redesignedAlloy.name || "Your Redesign",
        isRedesign: true,
      };
      
      // Extract values from predicted properties
      Object.entries(predictedProps).forEach(([key, value]) => {
        const numValue = parseFloat(String(value).replace(/[^\d.-]/g, ''));
        if (!isNaN(numValue)) {
          redesignData[key.toLowerCase().replace(/\s+/g, '_')] = numValue;
        }
      });
      
      // Add estimated cost if available
      if (redesignedAlloy.estimated_cost_per_kg) {
        redesignData.estimated_cost = redesignedAlloy.estimated_cost_per_kg;
      }
      
      referenceAlloys.push(redesignData);
    }
    
    return referenceAlloys;
  }, [result, apiData, finalOutput, xAxisProperty, yAxisProperty]);

  // Extract TTT data - prefer new format ttt_data
  const { tttCurve, coolingCurve } = useMemo(() => {
    // Check for new format ttt_data with curve and cooling
    if (apiData?.ttt_data) {
      return {
        tttCurve: apiData.ttt_data.curve || [],
        coolingCurve: apiData.ttt_data.cooling || [],
      };
    }
    
    // Legacy format
    if (finalOutput?.tttData && Array.isArray(finalOutput.tttData)) {
      return {
        tttCurve: finalOutput.tttData,
        coolingCurve: finalOutput.tttData.filter((d: any) => d.suggestedTemp !== undefined).map((d: any) => ({
          time: d.time,
          temp: d.suggestedTemp,
        })),
      };
    }
    
    // Generate sample TTT curve based on heat treatment data
    const heatTreatment = finalOutput?.redesigned_alloy?.heat_treatment_cycle;
    
    const baseTTTCurve = [
      { time: 1, temp: 700, phase: "Austenite" },
      { time: 10, temp: 650, phase: "Ferrite Start" },
      { time: 30, temp: 600, phase: "Pearlite Nose" },
      { time: 100, temp: 550, phase: "Bainite Start" },
      { time: 300, temp: 500, phase: "Bainite" },
      { time: 1000, temp: 450, phase: "Bainite" },
      { time: 3600, temp: 400, phase: "Martensite Start" },
      { time: 10000, temp: 350, phase: "Martensite" },
    ];
    
    let coolingCurveData: any[] = [];
    if (heatTreatment) {
      const austenitizingTemp = parseFloat(String(heatTreatment.austenitizing_temp).replace(/[^\d]/g, '')) || 850;
      const coolingRate = heatTreatment.cooling_rate || "Fast";
      const coolingMultiplier = coolingRate.toLowerCase().includes("fast") ? 0.5 : 
                                coolingRate.toLowerCase().includes("slow") ? 2 : 1;
      
      coolingCurveData = baseTTTCurve.map(point => ({
        time: point.time,
        temp: Math.max(200, austenitizingTemp - (Math.log10(point.time + 1) * 150 * coolingMultiplier)),
      }));
    }
    
    return { tttCurve: baseTTTCurve, coolingCurve: coolingCurveData };
  }, [result, apiData, finalOutput]);

  // Merge TTT data for the chart
  const mergedTTTData = useMemo(() => {
    if (coolingCurve.length === 0) {
      return tttCurve;
    }
    
    // Merge curve and cooling data by time
    const timeMap = new Map();
    
    tttCurve.forEach((point: any) => {
      timeMap.set(point.time, { ...point });
    });
    
    coolingCurve.forEach((point: any) => {
      if (timeMap.has(point.time)) {
        timeMap.get(point.time).coolingTemp = point.temp;
      } else {
        timeMap.set(point.time, { time: point.time, coolingTemp: point.temp });
      }
    });
    
    return Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
  }, [tttCurve, coolingCurve]);

  // Custom scatter shape for redesign points (star)
  const RedesignStar = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload.isRedesign) return null;
    
    return (
      <g>
        {/* Glow effect */}
        <circle 
          cx={cx} 
          cy={cy} 
          r={20} 
          fill="hsl(var(--primary))" 
          opacity={0.2}
          className="animate-pulse"
        />
        <circle 
          cx={cx} 
          cy={cy} 
          r={14} 
          fill="hsl(var(--primary))" 
          opacity={0.3}
        />
        {/* Star shape */}
        <polygon
          points={`${cx},${cy-12} ${cx+3},${cy-4} ${cx+11},${cy-4} ${cx+5},${cy+2} ${cx+7},${cy+10} ${cx},${cy+5} ${cx-7},${cy+10} ${cx-5},${cy+2} ${cx-11},${cy-4} ${cx-3},${cy-4}`}
          fill="hsl(var(--primary))"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth={1}
        />
      </g>
    );
  };

  // Custom tooltip for scatter chart
  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            {data.isRedesign && <Star className="w-4 h-4 text-primary fill-primary" />}
            <p className="font-semibold text-foreground">{data.name}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {xAxisOption.label}: {data[xAxisProperty] ?? data.x} {xAxisOption.unit}
          </p>
          <p className="text-sm text-muted-foreground">
            {yAxisOption.label}: {data[yAxisProperty] ?? data.y} {yAxisOption.unit}
          </p>
          {data.isRedesign && (
            <p className="text-xs text-primary font-medium mt-1">★ Your Redesigned Alloy</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for TTT chart
  const TTTTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          {data.phase && <p className="font-semibold text-foreground mb-1">{data.phase}</p>}
          <p className="text-sm text-muted-foreground">Time: {data.time}s</p>
          {data.temp && <p className="text-sm text-muted-foreground">TTT Temp: {data.temp}°C</p>}
          {data.coolingTemp && (
            <p className="text-sm text-primary">Cooling Rate: {Math.round(data.coolingTemp)}°C</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Ashby Plot - Scatter Chart */}
      <Card className="shadow-lg border-border/50">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Property Analysis - Ashby Plot
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="x-axis">X-Axis Property</Label>
              <Select value={xAxisProperty} onValueChange={setXAxisProperty}>
                <SelectTrigger id="x-axis">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {availableProperties.map((prop) => (
                    <SelectItem key={prop.key} value={prop.key}>
                      {prop.label} {prop.unit && `(${prop.unit})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="y-axis">Y-Axis Property</Label>
              <Select value={yAxisProperty} onValueChange={setYAxisProperty}>
                <SelectTrigger id="y-axis">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {availableProperties.map((prop) => (
                    <SelectItem key={prop.key} value={prop.key}>
                      {prop.label} {prop.unit && `(${prop.unit})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  type="number" 
                  dataKey={xAxisProperty} 
                  name={xAxisOption.label}
                  label={{ 
                    value: `${xAxisOption.label} (${xAxisOption.unit})`, 
                    position: 'bottom',
                    offset: 40,
                    className: 'fill-muted-foreground text-sm'
                  }}
                  className="text-xs fill-muted-foreground"
                  allowDataOverflow
                />
                <YAxis 
                  type="number" 
                  dataKey={yAxisProperty} 
                  name={yAxisOption.label}
                  label={{ 
                    value: `${yAxisOption.label} (${yAxisOption.unit})`, 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: -40,
                    className: 'fill-muted-foreground text-sm'
                  }}
                  className="text-xs fill-muted-foreground"
                />
                <Tooltip content={<ScatterTooltip />} />
                <Legend />
                <Scatter 
                  name="Reference Alloys" 
                  data={chartData.filter((d: any) => !d.isRedesign)} 
                  fill="hsl(var(--muted-foreground))"
                />
                <Scatter 
                  name="Your Redesign" 
                  data={chartData.filter((d: any) => d.isRedesign)} 
                  shape={<RedesignStar />}
                >
                  {chartData.filter((d: any) => d.isRedesign).map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill="hsl(var(--primary))"
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-primary fill-primary" />
            <p className="text-sm text-muted-foreground">
              Your redesigned alloy is highlighted as a glowing star for easy identification.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* TTT Diagram - Line Chart */}
      <Card className="shadow-lg border-border/50">
        <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-orange-500" />
            TTT Diagram (Time-Temperature-Transformation)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedTTTData} margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="time" 
                  scale="log"
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => value >= 3600 ? `${Math.round(value/3600)}h` : value >= 60 ? `${Math.round(value/60)}m` : `${value}s`}
                  label={{ 
                    value: 'Time (log scale)', 
                    position: 'bottom',
                    offset: 40,
                    className: 'fill-muted-foreground text-sm'
                  }}
                  className="text-xs fill-muted-foreground"
                />
                <YAxis 
                  domain={[200, 800]}
                  label={{ 
                    value: 'Temperature (°C)', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: -40,
                    className: 'fill-muted-foreground text-sm'
                  }}
                  className="text-xs fill-muted-foreground"
                />
                <Tooltip content={<TTTTooltip />} />
                <Legend />
                {/* TTT Curve - Solid Line */}
                <Line 
                  type="monotone" 
                  dataKey="temp" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--muted-foreground))', r: 4 }}
                  name="TTT Curve"
                  connectNulls
                />
                {/* Cooling Rate - Dashed Line */}
                {coolingCurve.length > 0 && (
                  <Line 
                    type="monotone" 
                    dataKey="coolingTemp" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    strokeDasharray="8 4"
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    name="Suggested Cooling Rate"
                    connectNulls
                  />
                )}
                <ReferenceLine 
                  y={400} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="3 3" 
                  label={{ value: 'Ms', position: 'right', className: 'fill-destructive text-xs' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-0.5 bg-muted-foreground"></div>
                <span className="text-sm font-medium">TTT Curve (Solid)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shows transformation start times at different temperatures.
              </p>
            </div>
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-0.5 bg-primary border-dashed border-t-2 border-primary"></div>
                <span className="text-sm font-medium text-primary">Cooling Rate (Dashed)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Derived from the heat treatment cycle to achieve target microstructure.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
