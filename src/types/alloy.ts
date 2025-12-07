export interface Composition {
  [element: string]: number | string;
}

export interface PropertyItem {
  id: string;
  name: string;
  value: string;
  unit: string;
}

export interface Properties {
  tensile_strength?: string;
  yield_strength?: string;
  hardness?: string;
  cost_per_kg?: number;
  original_properties?: PropertyItem[];
  [key: string]: string | number | PropertyItem[] | undefined;
}

export interface DesiredImprovement {
  id: string;
  property: string;
  value: string;
}

export interface AlloyData {
  original_alloy: {
    name: string;
    composition: Composition;
    properties: Properties;
  };
  desired_improvements: DesiredImprovement[];
  operating_conditions?: string;
  max_price_increase?: string;
}

export interface RedesignedAlloy {
  name: string;
  new_composition: Composition;
  predicted_properties: {
    [key: string]: string | number;
  };
  estimated_cost_per_kg: number;
  sustainability_score: number;
  probability_of_success: number;
}

export interface AlloyResult {
  status: string;
  original_alloy: {
    name: string;
    composition: Composition;
    tensile_strength?: string;
    yield_strength?: string;
    hardness?: string;
    cost_per_kg?: number;
  };
  desired_improvements: {
    [key: string]: string | boolean | number;
  };
  redesigned_alloy: RedesignedAlloy;
  analysis_summary: {
    cost_change_percent: number;
    performance_gain_percent: number;
    environmental_impact_change: number;
    remarks: string;
  };
  visuals?: {
    composition_chart_url?: string;
  };
}

export interface ExampleAlloy {
  name: string;
  composition: Composition;
  properties: Properties;
  description: string;
}
