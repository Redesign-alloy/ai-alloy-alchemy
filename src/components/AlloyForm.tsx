import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { AlloyData, DesiredImprovement, ExampleAlloy } from "@/types/alloy";
import { useToast } from "@/hooks/use-toast";

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
  const [properties, setProperties] = useState({
    tensile_strength: "",
    yield_strength: "",
    hardness: "",
    cost_per_kg: "",
  });
  const [improvements, setImprovements] = useState<DesiredImprovement[]>([
    { id: "1", property: "Target Tensile Strength", value: "" },
  ]);
  const [operatingConditions, setOperatingConditions] = useState("");
  const [maxPriceIncrease, setMaxPriceIncrease] = useState("");

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

      // Set properties
      setProperties({
        tensile_strength: example.properties.tensile_strength || "",
        yield_strength: example.properties.yield_strength || "",
        hardness: example.properties.hardness || "",
        cost_per_kg: example.properties.cost_per_kg?.toString() || "",
      });
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

  const addImprovement = () => {
    setImprovements([
      ...improvements,
      { id: Date.now().toString(), property: "", value: "" },
    ]);
  };

  const removeImprovement = (id: string) => {
    if (improvements.length > 1) {
      setImprovements(improvements.filter((imp) => imp.id !== id));
    }
  };

  const updateImprovement = (id: string, field: "property" | "value", value: string) => {
    setImprovements(
      improvements.map((imp) => (imp.id === id ? { ...imp, [field]: value } : imp))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const compositionObj: { [key: string]: number | string } = {};
    composition.forEach(({ element, value }) => {
      if (element && value) {
        compositionObj[element] = value;
      }
    });

    const data: AlloyData = {
      original_alloy: {
        name: alloyName,
        composition: compositionObj,
        properties: {
          tensile_strength: properties.tensile_strength,
          yield_strength: properties.yield_strength,
          hardness: properties.hardness,
          cost_per_kg: properties.cost_per_kg ? parseFloat(properties.cost_per_kg) : undefined,
        },
      },
      desired_improvements: improvements.filter((imp) => imp.property && imp.value),
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
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Properties */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tensile">Tensile Strength</Label>
              <Input
                id="tensile"
                value={properties.tensile_strength}
                onChange={(e) =>
                  setProperties({ ...properties, tensile_strength: e.target.value })
                }
                placeholder="e.g., 1080 MPa"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="yield">Yield Strength</Label>
              <Input
                id="yield"
                value={properties.yield_strength}
                onChange={(e) =>
                  setProperties({ ...properties, yield_strength: e.target.value })
                }
                placeholder="e.g., 850 MPa"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="hardness">Hardness</Label>
              <Input
                id="hardness"
                value={properties.hardness}
                onChange={(e) => setProperties({ ...properties, hardness: e.target.value })}
                placeholder="e.g., Rockwell C 35"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="cost">Cost per kg ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={properties.cost_per_kg}
                onChange={(e) => setProperties({ ...properties, cost_per_kg: e.target.value })}
                placeholder="e.g., 1.45"
                className="mt-1.5"
              />
            </div>
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
                    placeholder="Property"
                    value={imp.property}
                    onChange={(e) => updateImprovement(imp.id, "property", e.target.value)}
                    className="w-1/2"
                  />
                  <Input
                    placeholder="Target Value"
                    value={imp.value}
                    onChange={(e) => updateImprovement(imp.id, "value", e.target.value)}
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
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? "Analyzing..." : "Redesign Alloy"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
