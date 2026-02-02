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
  ReferenceLine,
} from "recharts";
import { TrendingUp, Thermometer, Sparkles, GitBranch } from "lucide-react";

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
  // DATA EXTRACTION: Support multiple data formats
  const apiData = result?.data;
  const redesignedAlloy = apiData?.redesigned_alloy || apiData;
  
  // Look for chart data in multiple locations for backward compatibility
  const chartRoot = redesignedAlloy?.chart_data;

  const availableProperties = useMemo((): PropertyOption[] => {
    const properties: PropertyOption[] = [];
    const seenKeys = new Set<string>();
    
    const predictedProps = redesignedAlloy?.predicted_properties || {};
    
    const addProperty = (key: string, label: string, unit: string) => {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      if (!seenKeys.has(normalizedKey)) {
        seenKeys.add(normalizedKey);
        properties.push({ key: normalizedKey, label, unit });
      }
    };
    
    addProperty("yield_strength", "Yield Strength", "MPa");
    addProperty("tensile_strength", "Tensile Strength", "MPa");
    addProperty("estimated_cost", "Estimated Cost", "$/kg");
    addProperty("density", "Density", "g/cm³");
    addProperty("hardness", "Hardness", "HRC");
    
    Object.keys(predictedProps).forEach((key) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      addProperty(key, label, "");
    });
    
    return properties;
  }, [redesignedAlloy]);

  const [xAxisProperty, setXAxisProperty] = useState<string>("yield_strength");
  const [yAxisProperty, setYAxisProperty] = useState<string>("estimated_cost");

  const xAxisOption = availableProperties.find(p => p.key === xAxisProperty) || availableProperties[0];
  const yAxisOption = availableProperties.find(p => p.key === yAxisProperty) || availableProperties[1];

  // ASHBY PLOT DATA - Check multiple possible locations
  const ashbyData = useMemo(() => {
    // Try different possible locations for ashby data
    let rawAshby = chartRoot?.ashby || 
                   redesignedAlloy?.ashby_data || 
                   apiData?.ashby_data ||
                   [];
    
    if (Array.isArray(rawAshby) && rawAshby.length > 0) {
      // The API returns data with properties directly: yield_strength, tensile_strength, density, estimated_cost
      return rawAshby;
    }
    return [];
  }, [chartRoot, redesignedAlloy, apiData]);

  // TTT CURVE DATA - Check multiple possible locations
  const tttCurveData = useMemo(() => {
    // Try different possible locations for TTT data
    const tttCurve = chartRoot?.ttt?.curve || 
                     redesignedAlloy?.ttt_curve ||
                     apiData?.ttt_curve ||
                     [];
    const curveData = Array.isArray(tttCurve) ? tttCurve : [];
    
    // Keep ALL data from the webhook response, including phases
    return curveData.map((point: any) => ({
      time: Number(point.time),
      temp: Number(point.temp),
      phases: point.phases || point.phase || '' // Support both 'phases' and 'phase' keys
    })).sort((a, b) => a.time - b.time);
  }, [chartRoot, redesignedAlloy, apiData]);

  // COOLING PATH DATA - Check multiple possible locations
  const coolingPathData = useMemo(() => {
    // Try different possible locations for cooling path data
    const coolingCurve = chartRoot?.ttt?.cooling || 
                         chartRoot?.ttt?.cooling_path || 
                         redesignedAlloy?.cooling_path ||
                         apiData?.cooling_path ||
                         [];
    const coolingData = Array.isArray(coolingCurve) ? coolingCurve : [];
    
    return coolingData.map((point: any) => ({
      time: Number(point.time),
      temp: Number(point.temp),
      phases: point.phases || point.phase || '' // Include phases if present in cooling data
    })).sort((a, b) => a.time - b.time);
  }, [chartRoot, redesignedAlloy, apiData]);

  // ANIMATED GLOWING STAR for redesigned alloy
  const RedesignStar = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload?.isRedesign) return null;
    
    return (
      <g className="animate-pulse">
        {/* Outer glow rings */}
        <circle cx={cx} cy={cy} r={32} fill="hsl(var(--primary))" opacity={0.1}>
          <animate attributeName="r" values="28;35;28" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.1;0.2;0.1" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={24} fill="hsl(var(--primary))" opacity={0.15}>
          <animate attributeName="r" values="20;26;20" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={16} fill="hsl(var(--primary))" opacity={0.25}>
          <animate attributeName="r" values="14;18;14" dur="2s" repeatCount="indefinite" />
        </circle>
        
        {/* Star shape */}
        <polygon
          points={`${cx},${cy-14} ${cx+4},${cy-5} ${cx+13},${cy-5} ${cx+6},${cy+2} ${cx+8},${cy+12} ${cx},${cy+6} ${cx-8},${cy+12} ${cx-6},${cy+2} ${cx-13},${cy-5} ${cx-4},${cy-5}`}
          fill="url(#starGradient)"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth={1.5}
          filter="url(#glow)"
        >
          <animate attributeName="opacity" values="0.9;1;0.9" dur="1.5s" repeatCount="indefinite" />
        </polygon>
        
        {/* Label */}
        <text x={cx} y={cy + 28} textAnchor="middle" fill="hsl(var(--primary))" fontSize="11" fontWeight="bold">
          REDESIGN
        </text>
        
        {/* SVG Defs for gradient and glow */}
        <defs>
          <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </g>
    );
  };

  // Reference alloy dot (muted gray)
  const ReferenceAlloyDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload?.isRedesign) return null;
    
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="hsl(var(--muted-foreground))" opacity={0.4} />
        <circle cx={cx} cy={cy} r={4} fill="hsl(var(--muted-foreground))" opacity={0.6} />
      </g>
    );
  };

  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isRedesign = data.isRedesign;
      
      return (
        <div className={`rounded-xl shadow-2xl p-4 border-2 backdrop-blur-sm ${
          isRedesign 
            ? 'bg-gradient-to-br from-primary/90 to-accent/90 border-primary text-primary-foreground' 
            : 'bg-popover/95 border-border text-foreground'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {isRedesign && <Sparkles className="w-4 h-4" />}
            <p className="font-bold text-lg">{data.name}</p>
          </div>
          <div className="space-y-1 text-sm opacity-90">
            <p>{xAxisOption.label}: <span className="font-semibold">{data[xAxisProperty]} {xAxisOption.unit}</span></p>
            <p>{yAxisOption.label}: <span className="font-semibold">{data[yAxisProperty]} {yAxisOption.unit}</span></p>
            {/* Show all other available properties */}
            {Object.entries(data).filter(([key]) => 
              !['name', 'isRedesign', xAxisProperty, yAxisProperty].includes(key)
            ).map(([key, value]) => (
              <p key={key} className="text-xs opacity-70">
                {key.replace(/_/g, ' ')}: <span className="font-medium">{String(value)}</span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const TTTTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      // Get the data from the first payload item (could be from TTT curve or cooling path)
      const tttPayload = payload.find((p: any) => p.name === 'TTT Curve');
      const coolingPayload = payload.find((p: any) => p.name === 'Cooling Path');
      
      // Get phases from TTT curve data or cooling path
      const phases = tttPayload?.payload?.phases || coolingPayload?.payload?.phases || '';
      const time = tttPayload?.payload?.time || coolingPayload?.payload?.time;
      
      return (
        <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-xl shadow-2xl p-4 max-w-sm">
          <p className="font-bold text-foreground mb-2">Time: {time}s</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.stroke }}>
              {entry.name}: <span className="font-semibold">{entry.value?.toFixed(0)}°C</span>
            </p>
          ))}
          {/* ALWAYS show phases section - dynamically display the phase at this point */}
          {phases && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Phase(s) at this point</p>
              <p className="text-sm font-medium text-primary leading-relaxed">{phases}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Check if we have any chart data to display
  const hasAshbyData = ashbyData.length > 0;
  const hasTTTData = tttCurveData.length > 0 || coolingPathData.length > 0;

  if (!hasAshbyData && !hasTTTData) {
    return null; // Don't render if no chart data available
  }

  return (
    <div className="space-y-8">
      {/* Ashby Plot Card */}
      {hasAshbyData && (
        <Card className="shadow-xl border-border/50 overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <span>Ashby Property Map</span>
                <p className="text-sm font-normal text-muted-foreground mt-0.5">
                  Compare redesigned alloy against {ashbyData.filter((d: any) => !d.isRedesign).length} reference materials
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6">
            {/* Axis Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">X-Axis Property</Label>
                <Select value={xAxisProperty} onValueChange={setXAxisProperty}>
                  <SelectTrigger className="h-12 border-2 border-border/50 hover:border-primary/50 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProperties.map((prop) => (
                      <SelectItem key={prop.key} value={prop.key}>{prop.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Y-Axis Property</Label>
                <Select value={yAxisProperty} onValueChange={setYAxisProperty}>
                  <SelectTrigger className="h-12 border-2 border-border/50 hover:border-primary/50 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProperties.map((prop) => (
                      <SelectItem key={prop.key} value={prop.key}>{prop.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-6 mb-4 px-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
                <span className="text-sm text-muted-foreground">Reference Alloys ({ashbyData.filter((d: any) => !d.isRedesign).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Redesigned Alloy</span>
              </div>
            </div>
            
            {/* Chart */}
            <div className="h-[450px] w-full rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 p-4">
              <ResponsiveContainer>
                <ScatterChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    type="number" 
                    dataKey={xAxisProperty} 
                    name={xAxisOption.label} 
                    unit={xAxisOption.unit}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    label={{ value: `${xAxisOption.label} (${xAxisOption.unit})`, position: 'bottom', offset: 10, fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey={yAxisProperty} 
                    name={yAxisOption.label} 
                    unit={yAxisOption.unit}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    label={{ value: `${yAxisOption.label} (${yAxisOption.unit})`, angle: -90, position: 'insideLeft', offset: 10, fill: 'hsl(var(--foreground))' }}
                  />
                  <Tooltip content={<ScatterTooltip />} />
                  {/* Reference alloys (muted gray dots) */}
                  <Scatter 
                    name="Reference Alloys" 
                    data={ashbyData.filter((d: any) => !d.isRedesign)} 
                    shape={<ReferenceAlloyDot />}
                  />
                  {/* Redesigned alloy (glowing star) */}
                  <Scatter 
                    name="Redesigned Alloy" 
                    data={ashbyData.filter((d: any) => d.isRedesign)} 
                    shape={<RedesignStar />}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Ashby Data Table - Show all materials */}
            <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Material Comparison Data
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Material</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Yield (MPa)</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Tensile (MPa)</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Density (g/cm³)</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Cost ($/kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ashbyData.map((item: any, idx: number) => (
                      <tr 
                        key={idx} 
                        className={`border-b border-border/30 transition-colors hover:bg-muted/50 ${item.isRedesign ? 'bg-primary/10 font-semibold' : ''}`}
                      >
                        <td className="py-2 px-2 flex items-center gap-2">
                          {item.isRedesign && <Sparkles className="w-3 h-3 text-primary" />}
                          <span className={item.isRedesign ? 'text-primary' : 'text-foreground'}>{item.name}</span>
                        </td>
                        <td className="text-right py-2 px-2">{item.yield_strength}</td>
                        <td className="text-right py-2 px-2">{item.tensile_strength}</td>
                        <td className="text-right py-2 px-2">{item.density}</td>
                        <td className="text-right py-2 px-2">{item.estimated_cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TTT Diagram Card */}
      {hasTTTData && (
        <Card className="shadow-xl border-border/50 overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
          <CardHeader className="bg-gradient-to-r from-orange-500/15 via-orange-500/10 to-amber-500/15 border-b border-orange-500/20">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Thermometer className="w-5 h-5 text-white" />
              </div>
              <div>
                <span>TTT Transformation Diagram</span>
                <p className="text-sm font-normal text-muted-foreground mt-0.5">
                  Time-Temperature-Transformation curve with {coolingPathData.length > 0 ? 'cooling path overlay' : 'phase boundaries'}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-6 mb-4 px-4">
              {tttCurveData.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-orange-500 rounded" />
                  <span className="text-sm text-muted-foreground">TTT Curve (Phase Boundary)</span>
                </div>
              )}
              {coolingPathData.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 border-t-2 border-dashed border-primary rounded" />
                  <span className="text-sm font-medium text-primary">Cooling Path (Actual Treatment)</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Ms Line (Martensite Start)</span>
              </div>
            </div>
            
            {/* Chart */}
            <div className="h-[450px] w-full rounded-xl bg-gradient-to-br from-orange-500/5 to-amber-500/5 p-4">
              <ResponsiveContainer>
                <LineChart margin={{ top: 20, right: 30, bottom: 30, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="time" 
                    scale="log" 
                    domain={['auto', 'auto']}
                    type="number"
                    allowDataOverflow
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    label={{ value: 'Time (seconds, log scale)', position: 'bottom', offset: 10, fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', offset: 10, fill: 'hsl(var(--foreground))' }}
                  />
                  <Tooltip content={<TTTTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: 20 }}
                    formatter={(value) => <span className="text-foreground font-medium">{value}</span>}
                  />
                  
                  {/* TTT Curve - solid orange line with phase data */}
                  {tttCurveData.length > 0 && (
                    <Line 
                      data={tttCurveData}
                      type="monotone" 
                      dataKey="temp" 
                      stroke="#f97316" 
                      name="TTT Curve" 
                      strokeWidth={3} 
                      dot={{ r: 5, fill: '#f97316', strokeWidth: 0 }}
                      activeDot={{ r: 8, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                      connectNulls
                    />
                  )}
                  
                  {/* Cooling Path - dashed primary colored line */}
                  {coolingPathData.length > 0 && (
                    <Line 
                      data={coolingPathData}
                      type="monotone" 
                      dataKey="temp" 
                      stroke="hsl(var(--primary))" 
                      name="Cooling Path" 
                      strokeDasharray="8 4" 
                      strokeWidth={4}
                      dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: '#fff', strokeWidth: 2 }}
                      connectNulls
                    />
                  )}
                  
                  {/* Ms Line (Martensite Start) */}
                  <ReferenceLine 
                    y={400} 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    label={{ value: "Ms (Martensite Start)", position: "right", fill: "#ef4444", fontSize: 12 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Phase Information Table - Shows all phases from the TTT data */}
            {tttCurveData.length > 0 && tttCurveData.some((d: any) => d.phases) && (
              <div className="mt-4 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  Phase Transformations at Key Time-Temperature Points (TTT Curve)
                </p>
                <div className="grid gap-2">
                  {tttCurveData.filter((d: any) => d.phases).map((point: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-background/50 border border-border/30 animate-in fade-in-0 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-muted-foreground">Time</span>
                        <span className="text-sm font-bold text-orange-600">{point.time}s</span>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-center gap-1 border-l border-border pl-3">
                        <span className="text-xs font-medium text-muted-foreground">Temp</span>
                        <span className="text-sm font-bold text-red-500">{point.temp}°C</span>
                      </div>
                      <div className="flex-1 border-l border-border pl-3">
                        <span className="text-xs font-medium text-muted-foreground">Phase(s)</span>
                        <p className="text-sm text-foreground leading-relaxed">{point.phases}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cooling Path Phase Table - Shows phases during cooling */}
            {coolingPathData.length > 0 && coolingPathData.some((d: any) => d.phases) && (
              <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-primary" />
                  Cooling Path Phase Evolution
                </p>
                <div className="grid gap-2">
                  {coolingPathData.filter((d: any) => d.phases).map((point: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-background/50 border border-border/30 animate-in fade-in-0 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-muted-foreground">Time</span>
                        <span className="text-sm font-bold text-primary">{point.time}s</span>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-center gap-1 border-l border-border pl-3">
                        <span className="text-xs font-medium text-muted-foreground">Temp</span>
                        <span className="text-sm font-bold text-red-500">{point.temp}°C</span>
                      </div>
                      <div className="flex-1 border-l border-border pl-3">
                        <span className="text-xs font-medium text-muted-foreground">Phase(s)</span>
                        <p className="text-sm text-foreground leading-relaxed">{point.phases}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Interpretation Note */}
            <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Interpretation:</span> The cooling path (dashed line) shows how the alloy temperature decreases during quenching. 
                Where this line intersects or avoids the TTT curve determines the final microstructure. 
                Rapid cooling that "misses" the nose of the TTT curve results in martensitic transformation.
                <span className="block mt-2 text-xs italic">Hover over any point on the curves to see the phase information at that time-temperature combination.</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
