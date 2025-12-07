// Element prices in INR per kg (approximate market rates)
export const ELEMENT_PRICES: { [key: string]: number } = {
  // Base metals
  Fe: 50,      // Iron
  Al: 180,     // Aluminum
  Cu: 750,     // Copper
  Zn: 250,     // Zinc
  Ni: 1800,    // Nickel
  Sn: 2200,    // Tin
  Pb: 180,     // Lead
  
  // Alloying elements
  C: 80,       // Carbon
  Mn: 150,     // Manganese
  Si: 120,     // Silicon
  Cr: 350,     // Chromium
  Mo: 3500,    // Molybdenum
  V: 4500,     // Vanadium
  W: 4000,     // Tungsten
  Ti: 900,     // Titanium
  Co: 4200,    // Cobalt
  Nb: 5000,    // Niobium
  Ta: 15000,   // Tantalum
  
  // Trace elements
  S: 30,       // Sulfur
  P: 80,       // Phosphorus
  N: 100,      // Nitrogen
  B: 500,      // Boron
  
  // Rare earths & others
  Mg: 220,     // Magnesium
  Ca: 400,     // Calcium
  Ce: 800,     // Cerium
  La: 750,     // Lanthanum
  Y: 3500,     // Yttrium
  Zr: 2800,    // Zirconium
  Hf: 50000,   // Hafnium
  Re: 250000,  // Rhenium
};

export const calculateCompositionCost = (
  composition: { element: string; value: string }[]
): number => {
  let totalCost = 0;
  let totalPercentage = 0;

  composition.forEach(({ element, value }) => {
    const percentage = parseFloat(value) || 0;
    const elementUpper = element.trim();
    const price = ELEMENT_PRICES[elementUpper] || ELEMENT_PRICES[element] || 100; // Default price if unknown
    
    if (percentage > 0) {
      totalCost += (percentage / 100) * price;
      totalPercentage += percentage;
    }
  });

  // If total percentage is less than 100, assume rest is base metal (Fe for steel)
  if (totalPercentage < 100 && totalPercentage > 0) {
    const remainingPercentage = 100 - totalPercentage;
    totalCost += (remainingPercentage / 100) * (ELEMENT_PRICES.Fe || 50);
  }

  return totalCost;
};

export const calculateCompositionCostFromObject = (
  composition: { [key: string]: number | string }
): number => {
  const compositionArray = Object.entries(composition).map(([element, value]) => ({
    element,
    value: String(value),
  }));
  return calculateCompositionCost(compositionArray);
};
