import type { Box } from "../schemas/deck.js";

export const SLIDE_WIDTH_IN = 13.333;
export const SLIDE_HEIGHT_IN = 7.5;

export function boxToInches(box: Box): { x: number; y: number; w: number; h: number } {
  return {
    x: round((box.x / 1000) * SLIDE_WIDTH_IN),
    y: round((box.y / 1000) * SLIDE_HEIGHT_IN),
    w: round((box.w / 1000) * SLIDE_WIDTH_IN),
    h: round((box.h / 1000) * SLIDE_HEIGHT_IN)
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
