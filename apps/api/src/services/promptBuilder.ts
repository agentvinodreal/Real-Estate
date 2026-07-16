export interface FloorPlanInputs {
  bhk: number;
  areaSqft: number;
  style: string;
  facing: string;
  extras: string[];
  floor: string;
}

const BHK_CONFIG: Record<number, string> = {
  1: "1 bedroom with attached bathroom, 1 kitchen, 1 living room",
  2: "2 bedrooms (1 master with attached bath, 1 common), 1 common bathroom, kitchen, living room",
  3: "3 bedrooms (1 master with attached bath, 2 common), 2 common bathrooms, kitchen, dining, living",
  4: "4 bedrooms (1 master with attached bath, 3 common), 3 bathrooms, kitchen, dining, living",
  5: "5 bedrooms (2 masters each with attached bath, 3 common), 3 bathrooms, kitchen, dining, living",
};

const STYLE_DESC: Record<string, string> = {
  modern:       "modern contemporary with clean lines, open spaces, and minimal walls",
  traditional:  "traditional Indian layout with separate kitchen and formal living room",
  vastu:        "Vastu Shastra compliant, east/north-facing main entry, pooja room in north-east",
  minimalist:   "minimalist with multifunctional open spaces and fewer partition walls",
  "open-plan":  "open-plan with connected kitchen, dining, and living area",
};

const FACING_DESC: Record<string, string> = {
  east:  "main entrance and living room facing east",
  west:  "main entrance facing west",
  north: "main entrance facing north",
  south: "main entrance facing south",
};

const EXTRAS_DESC: Record<string, string> = {
  pooja_room:      "dedicated pooja/prayer room (4x4 ft minimum)",
  study:           "study or home office room (100 sq ft)",
  servant_quarter: "servant quarter with attached toilet",
  store_room:      "storage/utility room near kitchen",
  balcony:         "balcony attached to master bedroom",
  gym:             "home gym or exercise room",
};

// Precise to-scale 2D floor plans are generated procedurally on the client
// (see apps/web/src/lib/floorPlanLayout.ts) since AI image models cannot reliably
// keep room proportions, labels, or door placement architecturally accurate.
// This prompt is only used for the optional, user-triggered photorealistic 3D
// exterior visualization — not for the blueprint itself.
export function buildVisualizationPrompt(inputs: FloorPlanInputs): string {
  const { bhk, areaSqft, style, facing, extras, floor } = inputs;

  const extraText = extras && extras.length > 0
    ? `The home includes: ${extras.map(e => EXTRAS_DESC[e] || e).join("; ")}.`
    : "";

  const floorText = floor === "ground"
    ? "a ground floor unit"
    : `a ${floor} floor unit`;

  return [
    `Generate a photorealistic 3D architectural exterior visualization of a residential home.`,
    `Unit type: ${bhk}BHK residential home, ${floorText}.`,
    `Total built-up area: ${areaSqft} square feet.`,
    `Orientation: ${FACING_DESC[facing] || "East-facing main entrance"}.`,
    `Architectural style: ${STYLE_DESC[style] || "modern contemporary"}.`,
    `Interior room configuration for reference: ${BHK_CONFIG[bhk] || BHK_CONFIG[3]}.`,
    extraText,
    `Rendering specifications:`,
    `- Photorealistic 3D exterior render, daytime, clear sky`,
    `- Show the building facade, entrance, windows, and roofline consistent with the architectural style`,
    `- Ground-level or slightly elevated three-quarter perspective view`,
    `- Do NOT include text, labels, dimensions, or top-down/floor-plan views`,
  ].filter(Boolean).join("\n");
}
