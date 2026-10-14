export type ShapeKind = 'rosette' | 'echo';
export interface CircleGeometry {
  cx: number;
  cy: number;
  r: number;
}
export interface ShapeOptions {
  kind?: ShapeKind;
  speed?: number;
  strength?: number;
  fps?: number;
  paused?: boolean;
  interactive?: boolean;
}
export interface ShapeStats {
  frames: number;
  kind: ShapeKind;
  circleCount: number;
  running: boolean;
  reducedMotion: boolean;
  phase: number;
  fpsLimit: number;
  hover: number;
}
export interface ShapeController {
  update(options?: ShapeOptions): void;
  getStats(): ShapeStats;
  destroy(): void;
}
export function getShapeGeometry(kind?: ShapeKind): CircleGeometry[];
export function createAnimatedShape(
  svg: SVGSVGElement,
  options?: ShapeOptions,
  host?: HTMLElement | SVGSVGElement,
): ShapeController;
