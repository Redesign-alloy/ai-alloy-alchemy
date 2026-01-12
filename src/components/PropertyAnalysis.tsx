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
  // DATA EXTRACTION: Pointing to the new nested "Mega-Object"
  const apiData = result?.data;
  const redesignedAlloy = apiData?.redesigned_alloy;
  const chartRoot = redesignedAlloy?.chart_data; // This contains ashby and ttt

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

  // ASHBY PLOT DATA
  const ashbyData = useMemo(() => {
    const rawAshby = chartRoot?.ashby || [];
    
    if (Array.isArray(rawAshby) && rawAshby.length > 0) {
      return rawAshby.map((point: any) => ({
        ...point,
        // Map backend x/y to current select values
        [xAxisProperty]: point.x,
        [yAxisProperty]: point.y,
      }));
    }
    return [];
  }, [chartRoot, xAxisProperty, yAxisProperty]);

  // TTT & COOLING DATA
  const mergedTTTData = useMemo(() => {
    const tttCurve = chartRoot?.ttt?.curve || [];
    const coolingCurve = chartRoot?.ttt?.cooling || [];

    if (tttCurve.length === 0) return [];

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
  }, [chartRoot]);

  // UI SHAPES & TOOLTIPS
  const RedesignStar = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload.isRedesign) return null;
    return (
      <g>
        <circle cx={cx} cy={cy} r={20} fill="hsl(var(--primary))" opacity={0.2} className="animate-pulse" />
        <polygon
          points={`${cx},${cy-12} ${cx+3},${cy-4} ${cx+11},${cy-4} ${cx+5},${cy+2} ${cx+7},${cy+10} ${cx},${cy+5} ${cx-7},${cy+10} ${cx-5},${cy+2} ${cx-11},${cy-4} ${cx-3},${cy-4}`}
          fill="hsl(var(--primary))"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth={1}
        />
      </g>
    );
  };

  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">{xAxisOption.label}: {data[xAxisProperty]} {xAxisOption.unit}</p>
          <p className="text-sm text-muted-foreground">{yAxisOption.label}: {data[yAxisProperty]} {yAxisOption.unit}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Ashby Plot Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Property Analysis - Ashby Plot
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label>X-Axis</Label>
              <Select value={xAxisProperty} onValueChange={setXAxisProperty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableProperties.map((prop) => (
                    <SelectItem key={prop.key} value={prop.key}>{prop.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Y-Axis</Label>
              <Select value={yAxisProperty} onValueChange={setYAxisProperty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableProperties.map((prop) => (
                    <SelectItem key={prop.key} value={prop.key}>{prop.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey={xAxisProperty} name={xAxisOption.label} unit={xAxisOption.unit} />
                <YAxis type="number" dataKey={yAxisProperty} name={yAxisOption.label} unit={yAxisOption.unit} />
                <Tooltip content={<ScatterTooltip />} />
                <Scatter name="Reference" data={ashbyData.filter((d: any) => !d.isRedesign)} fill="#8884d8" />
                <Scatter name="Redesign" data={ashbyData.filter((d: any) => d.isRedesign)} shape={<RedesignStar />} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* TTT Diagram Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-500/5 to-red-500/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-orange-500" /> TTT Diagram
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer>
              <LineChart data={mergedTTTData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" scale="log" domain={['auto', 'auto']} />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temp" stroke="#8884d8" name="TTT Curve" strokeWidth={2} dot={{r: 4}} />
                <Line type="monotone" dataKey="coolingTemp" stroke="hsl(var(--primary))" name="Cooling Path" strokeDasharray="5 5" strokeWidth={3} />
                <ReferenceLine y={400} stroke="red" label="Ms" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
