import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExampleAlloy } from "@/types/alloy";
import { Beaker } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const examples: ExampleAlloy[] = [
  {
    name: "AISI 4340",
    composition: {
      Fe: "95.3-98.7",
      Ni: "1.8-2.0",
      Cr: "0.08-0.09",
      Mo: "0.25",
      C: "0.4-0.57",
      Mn: "0.7-1.0",
      Si: "0.03-0.05",
    },
    properties: {
      tensile_strength: "1080 MPa",
      yield_strength: "850 MPa",
      hardness: "Rockwell C 35",
      cost_per_kg: 1.45,
    },
    description: "High-strength low-alloy steel, commonly used in aircraft landing gear",
  },
  {
    name: "316L Stainless Steel",
    composition: {
      Fe: "62-72",
      Cr: "16-18",
      Ni: "10-14",
      Mo: "2-3",
      C: "0.03",
      Mn: "2.0",
      Si: "0.75",
    },
    properties: {
      tensile_strength: "485 MPa",
      yield_strength: "170 MPa",
      hardness: "Rockwell B 95",
      cost_per_kg: 3.25,
    },
    description: "Corrosion-resistant steel for marine and medical applications",
  },
  {
    name: "A36 Carbon Steel",
    composition: {
      Fe: "98",
      C: "0.26",
      Mn: "0.8",
      Si: "0.28",
      Cu: "0.2",
      P: "0.04",
      S: "0.05",
    },
    properties: {
      tensile_strength: "400-550 MPa",
      yield_strength: "250 MPa",
      hardness: "Rockwell B 70",
      cost_per_kg: 0.85,
    },
    description: "Standard structural steel for construction and general engineering",
  },
  {
    name: "Fe 500D",
    composition: {
      C: "0.18",
      Mn: "1.20",
      S: "0.035",
      P: "0.035",
      V: "0.005",
    },
    properties: {
      tensile_strength: "580 MPa",
      yield_strength: "510 MPa",
      operating_conditions: "Ambient, High Seismic Zone",
    },
    description: "TMT rebar steel for seismic zones with 6% elongation and 0.40 max CE",
  },
  {
    name: "Fe 500D CRS",
    composition: {
      C: "0.15",
      Mn: "1.10",
      S: "0.030",
      P: "0.030",
      Cu: "0.20",
      Cr: "0.15",
    },
    properties: {
      tensile_strength: "590 MPa",
      yield_strength: "520 MPa",
      operating_conditions: "Saline/Chloride Marine Environment",
    },
    description: "Corrosion-resistant TMT rebar for marine environments with minimized corrosion rate",
  },
  {
    name: "Fe 550D",
    composition: {
      C: "0.22",
      Mn: "1.30",
      S: "0.040",
      P: "0.040",
      Nb: "0.015",
    },
    properties: {
      tensile_strength: "610 MPa",
      yield_strength: "540 MPa",
      operating_conditions: "Ambient, Heavy Load Structure",
    },
    description: "High-strength TMT rebar for heavy load structures targeting 560 MPa yield",
  },
];

export const ExampleSelector = () => {
  const { toast } = useToast();

  const loadExample = (example: ExampleAlloy) => {
    // Dispatch custom event to load example data
    window.dispatchEvent(
      new CustomEvent("loadExample", {
        detail: example,
      })
    );

    toast({
      title: "Example Loaded",
      description: `${example.name} data has been loaded into the form`,
    });
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Beaker className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Quick Start Examples</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {examples.map((example) => (
            <div
              key={example.name}
              className="bg-card rounded-lg border border-border/50 p-4 hover:border-primary/50 transition-colors"
            >
              <h4 className="font-semibold text-primary mb-2">{example.name}</h4>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {example.description}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadExample(example)}
                className="w-full"
              >
                Load Example
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
