import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Sparkles, IndianRupee } from "lucide-react";
import { AlloyData, DesiredImprovement, ExampleAlloy, PropertyItem } from "@/types/alloy";
import { useToast } from "@/hooks/use-toast";
import { calculateCompositionCost } from "@/lib/elementPrices";

interface AlloyFormProps {
  onSubmit: (data: AlloyData) => void;
  isLoading: boolean;
}

export const AlloyForm = ({ onSubmit, isLoading }: AlloyFormProps) => {
  const { toast } = useToast();
  const [alloyName, setAlloyName] = useState("");
  const [composition, setComposition] = useState<{ element: string; value: string }[]>([
    { element: "Fe", value: "" },
    { element: "C", value: "" },
  ]);
  const [dynamicProperties, setDynamicProperties] = useState<PropertyItem[]>([
    { id: "1", name: "Tensile Strength", value: "", unit: "MPa" },
    { id: "2", name: "Yield Strength", value: "", unit: "MPa" },
  ]);
  const [improvements, setImprovements] = useState<DesiredImprovement[]>([
    { id: "1", property: "Target Tensile Strength", value: "", unit: "MPa" },
  ]);
  const [operatingConditions, setOperatingConditions] = useState("");
  const [maxPriceIncrease, setMaxPriceIncrease] = useState("");

  // Calculate cost based on composition
  const estimatedCost = useMemo(() => {
    return calculateCompositionCost(composition);
  }, [composition]);

  // Listen for example load events
  useEffect(() => {
    const handleLoadExample = (event: CustomEvent<ExampleAlloy>) => {
      const example = event.detail;
      setAlloyName(example.name);
      
      // Convert composition object to array
      const compositionArray = Object.entries(example.composition).map(([element, value]) => ({
        element,
        value: String(value),
      }));
      setComposition(compositionArray);

      // Convert properties to dynamic array
      const propsArray: PropertyItem[] = [];
      if (example.properties.tensile_strength) {
        propsArray.push({ id: Date.now().toString() + "1", name: "Tensile Strength", value: example.properties.tensile_strength.replace(/[^\d.]/g, ''), unit: "MPa" });
      }
      if (example.properties.yield_strength) {
        propsArray.push({ id: Date.now().toString() + "2", name: "Yield Strength", value: example.properties.yield_strength.replace(/[^\d.]/g, ''), unit: "MPa" });
      }
      if (example.properties.hardness) {
        propsArray.push({ id: Date.now().toString() + "3", name: "Hardness", value: example.properties.hardness, unit: "" });
      }
      if (propsArray.length > 0) {
        setDynamicProperties(propsArray);
      }
    };

    window.addEventListener("loadExample", handleLoadExample as EventListener);
    return () => {
      window.removeEventListener("loadExample", handleLoadExample as EventListener);
    };
  }, []);

  const addCompositionElement = () => {
    setComposition([...composition, { element: "", value: "" }]);
  };

  const removeCompositionElement = (index: number) => {
    setComposition(composition.filter((_, i) => i !== index));
  };

  const updateComposition = (index: number, field: "element" | "value", value: string) => {
    const updated = [...composition];
    updated[index][field] = value;
    setComposition(updated);
  };

  // Dynamic properties management
  const addProperty = () => {
    setDynamicProperties([
      ...dynamicProperties,
      { id: Date.now().toString(), name: "", value: "", unit: "" },
    ]);
  };

  const removeProperty = (id: string) => {
    if (dynamicProperties.length > 1) {
      setDynamicProperties(dynamicProperties.filter((prop) => prop.id !== id));
    }
  };

  const updateProperty = (id: string, field: "name" | "value" | "unit", value: string) => {
    setDynamicProperties(
      dynamicProperties.map((prop) => (prop.id === id ? { ...prop, [field]: value } : prop))
    );
  };

  const addImprovement = () => {
    setImprovements([
      ...improvements,
      { id: Date.now().toString(), property: "", value: "", unit: "" },
    ]);
  };

  const removeImprovement = (id: string) => {
    if (improvements.length > 1) {
      setImprovements(improvements.filter((imp) => imp.id !== id));
    }
  };

  const updateImprovement = (id: string, field: "property" | "value" | "unit", value: string) => {
    setImprovements(
      improvements.map((imp) => (imp.id === id ? { ...imp, [field]: value } : imp))
    );
  };

  const handleRedesign = () => {
    const compositionObj: { [key: string]: number | string } = {};
    composition.forEach(({ element, value }) => {
      if (element && value) {
        compositionObj[element] = value;
      }
    });

    // Build properties object with dynamic properties
    const propertiesObj: { [key: string]: string | number | PropertyItem[] | undefined } = {
      original_properties: dynamicProperties.filter((prop) => prop.name && prop.value),
      cost_per_kg: estimatedCost,
    };

    // Also map to legacy fields for backward compatibility
    dynamicProperties.forEach((prop) => {
      if (prop.name.toLowerCase().includes("tensile")) {
        propertiesObj.tensile_strength = `${prop.value} ${prop.unit}`.trim();
      } else if (prop.name.toLowerCase().includes("yield")) {
        propertiesObj.yield_strength = `${prop.value} ${prop.unit}`.trim();
      } else if (prop.name.toLowerCase().includes("hardness")) {
        propertiesObj.hardness = `${prop.value} ${prop.unit}`.trim();
      }
    });

    // Build desired_improvements_array with name, value, unit structure
    const desiredImprovementsArray = improvements
      .filter((imp) => imp.property && imp.value)
      .map((imp) => ({
        name: imp.property,
        value: imp.value,
        unit: imp.unit,
      }));

    const data: AlloyData = {
      original_alloy: {
        name: alloyName,
        composition: compositionObj,
        properties: propertiesObj,
      },
      desired_improvements: improvements.filter((imp) => imp.property && imp.value),
      desired_improvements_array: desiredImprovementsArray,
      operating_conditions: operatingConditions,
      max_price_increase: maxPriceIncrease,
    };

    onSubmit(data);
    toast({
      title: "Analysis Started",
      description: "Your alloy redesign request is being processed...",
    });
  };

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Alloy Input Parameters
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Alloy Name */}
          <div>
            <Label htmlFor="alloyName">Alloy Name</Label>
            <Input
              id="alloyName"
              value={alloyName}
              onChange={(e) => setAlloyName(e.target.value)}
              placeholder="e.g., AISI 4340"
              className="mt-1.5"
            />
          </div>

          {/* Composition */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Composition (%)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCompositionElement}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Element
              </Button>
            </div>
            <div className="space-y-2">
              {composition.map((comp, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Element"
                    value={comp.element}
                    onChange={(e) => updateComposition(index, "element", e.target.value)}
                    className="w-1/3"
                  />
                  <Input
                    placeholder="Value/Range"
                    value={comp.value}
                    onChange={(e) => updateComposition(index, "value", e.target.value)}
                  />
                  {composition.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCompositionElement(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Properties */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Original Alloy Properties</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProperty}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Property
              </Button>
            </div>
            <div className="space-y-2">
              {dynamicProperties.map((prop) => (
                <div key={prop.id} className="flex gap-2">
                  <Input
                    placeholder="Property Name"
                    value={prop.name}
                    onChange={(e) => updateProperty(prop.id, "name", e.target.value)}
                    className="w-1/3"
                  />
                  <Input
                    placeholder="Value"
                    value={prop.value}
                    onChange={(e) => updateProperty(prop.id, "value", e.target.value)}
                    className="w-1/4"
                  />
                  <Input
                    placeholder="Unit"
                    value={prop.unit}
                    onChange={(e) => updateProperty(prop.id, "unit", e.target.value)}
                    className="w-1/4"
                  />
                  {dynamicProperties.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProperty(prop.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Estimated Cost Display */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-primary" />
                Estimated Cost per kg (₹)
              </Label>
              <span className="text-lg font-semibold text-primary">
                ₹{estimatedCost.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Calculated from composition using live elemental prices
            </p>
          </div>

          {/* Desired Improvements */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Desired Improvements</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addImprovement}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Improvement
              </Button>
            </div>
            <div className="space-y-2">
              {improvements.map((imp) => (
                <div key={imp.id} className="flex gap-2">
                  <Input
                    placeholder="Property Name"
                    value={imp.property}
                    onChange={(e) => updateImprovement(imp.id, "property", e.target.value)}
                    className="w-1/3"
                  />
                  <Input
                    placeholder="Value"
                    value={imp.value}
                    onChange={(e) => updateImprovement(imp.id, "value", e.target.value)}
                    className="w-1/4"
                  />
                  <Input
                    placeholder="Unit"
                    value={imp.unit}
                    onChange={(e) => updateImprovement(imp.id, "unit", e.target.value)}
                    className="w-1/4"
                  />
                  {improvements.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeImprovement(imp.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Operating Conditions */}
          <div>
            <Label htmlFor="conditions">Operating Conditions</Label>
            <Textarea
              id="conditions"
              value={operatingConditions}
              onChange={(e) => setOperatingConditions(e.target.value)}
              placeholder="e.g., High temperature (500°C), Corrosive marine environment"
              className="mt-1.5 min-h-[80px]"
            />
          </div>

          {/* Max Price Increase */}
          <div>
            <Label htmlFor="maxPrice">Maximum Price Increase (%)</Label>
            <Input
              id="maxPrice"
              value={maxPriceIncrease}
              onChange={(e) => setMaxPriceIncrease(e.target.value)}
              placeholder="e.g., 15"
              className="mt-1.5"
            />
          </div>

          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={isLoading}
            onClick={handleRedesign}
          >
            {isLoading ? "Analyzing..." : "Redesign Alloy"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
