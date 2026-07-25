export interface FloorPlanInputs {
  bhk: number;
  areaSqft: number;
  style: string;
  facing: string;
  extras: string[];
  floor: string;
  layout?: {
    plotWidthFt: number;
    plotHeightFt: number;
    rooms: Array<{
      id: string;
      label: string;
      category: string;
      x: number;
      y: number;
      width: number;
      height: number;
      areaSqft: number;
      zone: string;
      zoneLabel: string;
    }>;
  };
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

function buildArchitecturalDescription(layout: any): string {
  if (!layout || !layout.rooms || layout.rooms.length === 0) return "";

  const bedrooms = layout.rooms.filter((r: any) => r.category === 'bedroom');
  const livingRooms = layout.rooms.filter((r: any) => r.category === 'living');
  const kitchen = layout.rooms.find((r: any) => r.category === 'kitchen');
  const balconies = layout.rooms.filter((r: any) => r.id.includes('balcony') || r.label.toLowerCase().includes('balcony'));

  let desc = `Interior room placement inside the cutaway (looking down into the home): `;

  if (livingRooms.length > 0) {
    desc += `Place the open living area toward the ${livingRooms[0].zoneLabel || 'North/Northeast'} section. `;
  }
  if (kitchen) {
    desc += `Position the kitchen in the ${kitchen.zoneLabel || 'Southeast'} corner. `;
  }
  if (bedrooms.length > 0) {
    desc += `Arrange the bedrooms with the master bedroom in the ${bedrooms[0].zoneLabel || 'Southwest'} corner. `;
  }
  if (balconies.length > 0) {
    desc += `Include balconies opening off the bedrooms. `;
  }

  desc += `Keep interior walls, doorways, and furniture arranged to match these relative positions.`;
  return desc;
}

// Precise to-scale 2D floor plans are generated procedurally on the client
// (see apps/web/src/lib/floorPlanLayout.ts) since AI image models cannot reliably
// keep room proportions, labels, or door placement architecturally accurate.
// This prompt is only used for the optional, user-triggered 3D visualization —
// a furnished isometric cutaway "dollhouse" render, not the blueprint itself.
export function buildVisualizationPrompt(inputs: FloorPlanInputs): string {
  const { bhk, areaSqft, style, facing, extras, floor, layout } = inputs;

  const extraText = extras && extras.length > 0
    ? `The home includes: ${extras.map(e => EXTRAS_DESC[e] || e).join("; ")}.`
    : "";

  const floorText = floor === "ground"
    ? "a ground floor unit"
    : `a ${floor} floor unit`;

  const layoutText = layout ? buildArchitecturalDescription(layout) : "";

  return [
    `IMPORTANT RULE (apply to the entire image): render zero text of any kind anywhere in the image. No letters, no words, no numbers, no signage, no labels, no room names, no measurements, no logos, no watermarks — not even blurry, tiny, decorative, or illegible text. Walls, doors, and furniture must be plain and unmarked. If you are unsure whether something counts as text, leave it out.`,
    `Generate a clean, high-quality, photorealistic 3D isometric cutaway floor plan visualization of a residential home interior — a "dollhouse" view seen from a top-down 45-degree angle with the roof removed, looking down into the fully furnished rooms.`,
    `Unit type: ${bhk}BHK residential home, ${floorText}.`,
    `Total built-up area: ${areaSqft} square feet.`,
    `Orientation: ${FACING_DESC[facing] || "East-facing main entrance"}.`,
    `Architectural style: ${STYLE_DESC[style] || "modern contemporary"}.`,
    `Room configuration: ${BHK_CONFIG[bhk] || BHK_CONFIG[3]}.`,
    extraText,
    layoutText,
    `Rendering specifications:`,
    `- Modern, upscale, aesthetic interior design: contemporary furniture, warm wood floors, soft neutral palette, designer lighting, indoor plants, and tasteful decor`,
    `- Photorealistic 3D isometric cutaway render with clean crisp walls, realistic soft daylight and gentle ambient shadows, subtle sun rays through windows`,
    `- Each room clearly furnished and distinguishable purely through its furniture (bedrooms with beds, kitchen with cabinets and appliances, living room with sofa, bathrooms with fixtures, dining with table) — never through written labels`,
    `- Neutral light-grey background, single home floor centered in frame, balanced composition`,
    `- FINAL REMINDER: the image must contain absolutely no text, letters, numbers, or writing anywhere — not on walls, floors, furniture, signage, or as an overlay. A clean, unobstructed, text-free 3D render only.`,
  ].filter(Boolean).join("\n");
}
