import type { DeckSpec } from "../schemas/deck.js";
import { SLIDE_HEIGHT_IN, SLIDE_WIDTH_IN } from "./units.js";

export function applySlideChrome(slide: any, deck: DeckSpec, slideIndex: number): void {
  if (!deck.theme.footer.enabled) {
    return;
  }

  const colors = deck.theme.colors;
  const footerText = deck.theme.footer.text || deck.meta.title;

  slide.addShape("line", {
    x: 0.72,
    y: SLIDE_HEIGHT_IN - 0.46,
    w: SLIDE_WIDTH_IN - 1.44,
    h: 0,
    line: { color: colors.border, width: 0.6, transparency: 18 }
  });

  slide.addText(footerText, {
    x: 0.72,
    y: SLIDE_HEIGHT_IN - 0.33,
    w: 7.8,
    h: 0.18,
    fontFace: deck.theme.fontFace,
    fontSize: 7.5,
    color: colors.muted,
    margin: 0
  });

  slide.addText(String(slideIndex + 1).padStart(2, "0"), {
    x: SLIDE_WIDTH_IN - 1.22,
    y: SLIDE_HEIGHT_IN - 0.34,
    w: 0.5,
    h: 0.18,
    fontFace: deck.theme.fontFace,
    fontSize: 7.5,
    color: colors.muted,
    align: "right",
    margin: 0
  });
}
