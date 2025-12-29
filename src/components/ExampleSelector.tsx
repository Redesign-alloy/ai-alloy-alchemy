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
      tensile_strength: "475 MPa",
      yield_strength: "250 MPa",
      hardness: "Rockwell B 70",
      cost_per_kg: 0.85,
    },
    description: "Standard structural steel for construction and general engineering",
  },
  {
    name: "Ti-6Al-4V (Grade 5)",
    composition: {
      Ti: "90.0",
      Al: "6.0",
      V: "4.0",
      Fe: "0.25",
      O: "0.20",
    },
    properties: {
      tensile_strength: "1050 MPa",
      yield_strength: "900 MPa",
      hardness: "36 HRC",
      cost_per_kg: 25.0,
    },
    description: "Aerospace-grade titanium alloy with excellent strength-to-weight ratio, max operating temp 400°C",
  },
  {
    name: "Inconel 718",
    composition: {
      Ni: "52.5",
      Cr: "19.0",
      Fe: "17.0",
      Nb: "5.1",
      Mo: "3.0",
      Ti: "0.9",
      Al: "0.5",
    },
    properties: {
      tensile_strength: "1350 MPa",
      yield_strength: "1100 MPa",
      hardness: "40 HRC",
      cost_per_kg: 45.0,
    },
    description: "Nickel superalloy for high-temperature applications up to 700°C, used in jet engines",
  },
  {
    name: "Al-Li 2099",
    composition: {
      Al: "94.3",
      Cu: "2.7",
      Li: "1.8",
      Zn: "0.7",
      Mg: "0.3",
      Mn: "0.1",
      Zr: "0.1",
    },
    properties: {
      tensile_strength: "560 MPa",
      yield_strength: "510 MPa",
      hardness: "Rockwell B 85",
      cost_per_kg: 12.0,
    },
    description: "Lightweight aluminum-lithium alloy for aerospace structures, max operating temp 150°C",
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
