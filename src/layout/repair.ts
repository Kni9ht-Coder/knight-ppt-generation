import { deckSpecSchema, type DeckSpec, type SlideElement } from "../schemas/deck.js";

export function repairDeckSpec(deck: DeckSpec): DeckSpec {
  const repaired = structuredClone(deck);

  for (const slide of repaired.slides) {
    for (const element of slide.elements) {
      clampElement(element);
    }
  }

  return deckSpecSchema.parse(repaired);
}

function clampElement(element: SlideElement): void {
  const box = element.box;
  box.x = clamp(box.x, 0, 999);
  box.y = clamp(box.y, 0, 999);
  box.w = clamp(box.w, 1, 1000 - box.x);
  box.h = clamp(box.h, 1, 1000 - box.y);

  if (element.type === "text") {
    if (!element.style.fontSize) {
      element.style.fontSize = defaultFontSize(element.role);
    }
  }
}

function defaultFontSize(role: Extract<SlideElement, { type: "text" }>["role"]): number {
  switch (role) {
    case "title":
      return 28;
    case "claim":
      return 18;
    case "metric":
      return 20;
    case "caption":
    case "footer":
      return 10;
    case "evidence":
      return 12;
    case "subtitle":
      return 16;
    case "label":
      return 11;
    case "body":
    default:
      return 14;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
