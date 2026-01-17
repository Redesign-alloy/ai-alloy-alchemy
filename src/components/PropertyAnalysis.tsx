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
  // DATA EXTRACTION: Pointing to the new nested "Mega-Object"
  const apiData = result?.data;
  const redesignedAlloy = apiData?.redesigned_alloy || apiData;
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

  // ASHBY PLOT DATA - Use the raw ashby data directly with its properties
  const ashbyData = useMemo(() => {
    const rawAshby = chartRoot?.ashby || [];
    
    if (Array.isArray(rawAshby) && rawAshby.length > 0) {
      // The API returns data with properties directly: yield_strength, tensile_strength, density, estimated_cost
      // No need to map x/y - the chart uses dataKey props to read the correct properties
      return rawAshby;
    }
    return [];
  }, [chartRoot]);

  // TTT & COOLING DATA - Merge curve and cooling data for overlay
  const mergedTTTData = useMemo(() => {
    const tttCurve = chartRoot?.ttt?.curve || [];
    const coolingCurve = chartRoot?.ttt?.cooling || [];

    // Handle both flat and nested structures
    const curveData = Array.isArray(tttCurve) ? tttCurve : [];
    const coolingData = Array.isArray(coolingCurve) ? coolingCurve : [];

    if (curveData.length === 0 && coolingData.length === 0) return [];

    const timeMap = new Map();

    // Add TTT curve points
    curveData.forEach((point: any) => {
      const time = Number(point.time);
      if (!isNaN(time)) {
        timeMap.set(time, { time, temp: Number(point.temp), phases: point.phases });
      }
    });

    // Add cooling path points
    coolingData.forEach((point: any) => {
      const time = Number(point.time);
      if (!isNaN(time)) {
        if (timeMap.has(time)) {
          timeMap.get(time).coolingTemp = Number(point.temp);
        } else {
          timeMap.set(time, { time, coolingTemp: Number(point.temp) });
        }
      }
    });

    return Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
  }, [chartRoot]);

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
          </div>
        </div>
      );
    }
    return null;
  };

  const TTTTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-xl shadow-2xl p-4">
          <p className="font-bold text-foreground mb-2">Time: {payload[0]?.payload?.time}s</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.stroke }}>
              {entry.name}: <span className="font-semibold">{entry.value?.toFixed(0)}°C</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Ashby Plot Card */}
      <Card className="shadow-xl border-border/50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-b border-border/50">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>Ashby Property Map</span>
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                Compare redesigned alloy against reference materials
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
              <span className="text-sm text-muted-foreground">Reference Alloys</span>
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
        </CardContent>
      </Card>

      {/* TTT Diagram Card */}
      <Card className="shadow-xl border-border/50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500/15 via-orange-500/10 to-amber-500/15 border-b border-orange-500/20">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Thermometer className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>TTT Transformation Diagram</span>
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                Time-Temperature-Transformation curve with cooling path overlay
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          {/* Legend */}
          <div className="flex items-center gap-6 mb-4 px-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-orange-500 rounded" />
              <span className="text-sm text-muted-foreground">TTT Curve (Phase Boundary)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 border-t-2 border-dashed border-primary rounded" />
              <span className="text-sm font-medium text-primary">Cooling Path (Actual Treatment)</span>
            </div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Ms Line (Martensite Start)</span>
            </div>
          </div>
          
          {/* Chart */}
          <div className="h-[450px] w-full rounded-xl bg-gradient-to-br from-orange-500/5 to-amber-500/5 p-4">
            <ResponsiveContainer>
              <LineChart data={mergedTTTData} margin={{ top: 20, right: 30, bottom: 30, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="time" 
                  scale="log" 
                  domain={['auto', 'auto']}
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
                
                {/* TTT Curve - solid orange line */}
                <Line 
                  type="monotone" 
                  dataKey="temp" 
                  stroke="#f97316" 
                  name="TTT Curve" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                />
                
                {/* Cooling Path - dashed primary colored line */}
                <Line 
                  type="monotone" 
                  dataKey="coolingTemp" 
                  stroke="hsl(var(--primary))" 
                  name="Cooling Path" 
                  strokeDasharray="8 4" 
                  strokeWidth={4}
                  dot={false}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: '#fff', strokeWidth: 2 }}
                />
                
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
          
          {/* Interpretation Note */}
          <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Interpretation:</span> The cooling path (dashed line) shows how the alloy temperature decreases during quenching. 
              Where this line intersects or avoids the TTT curve determines the final microstructure. 
              Rapid cooling that "misses" the nose of the TTT curve results in martensitic transformation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
