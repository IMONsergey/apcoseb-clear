export interface FlowOptions {
  /** 0–4; 0 freezes. Default 1. */
  speed?: number;
  /** 0–2; default 1. */
  strength?: number;
  /** Maximum update rate, 10–60. Default 30. */
  fps?: number;
  /** Maximum length of the canvas's longest axis, 64–320. Default 192. */
  resolution?: number;
  paused?: boolean;
  /** Automatically reduce resolution when rendering is consistently expensive. */
  adaptive?: boolean;
  theme?: 'light' | 'dark';
}
export interface FlowStats {
  supported: boolean;
  running?: boolean;
  reducedMotion?: boolean;
  width?: number;
  height?: number;
  frames?: number;
  fps?: number;
  targetFps?: number;
  lastRenderMs?: number;
  averageRenderMs?: number;
  bufferBytes?: number;
  sharedBrushBytes?: number;
  sharedSphereWaveBytes?: number;
}
export interface FlowController {
  update(options?: FlowOptions): void;
  getStats(): FlowStats;
  destroy(): void;
}
export function createTurquoiseFlow(
  canvas: HTMLCanvasElement,
  options?: FlowOptions,
): FlowController;
