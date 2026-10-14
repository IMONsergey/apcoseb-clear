export interface GlobeOptions {
  speed?: number;
  fps?: number;
  paused?: boolean;
  interactive?: boolean;
  renderer?: 'auto' | 'canvas2d';
  pixelRatio?: number;
  landColor?: string;
  shellColor?: string;
  signalColor?: string;
}
export interface GlobeStats {
  renderer: string;
  frames: number;
  phase: number;
  running: boolean;
  landPoints: number;
  shellPoints: number;
  signals: number;
  submissionMs: number;
  width: number;
  height: number;
  pixelRatio: number;
  globeYaw: number;
  shellYaw: number;
  hoverX: number;
  hoverY: number;
}
export interface GlobeController {
  update(options?: Omit<GlobeOptions, 'renderer'>): void;
  getStats(): GlobeStats;
  destroy(): void;
}
export function createSignalGlobe(
  canvas: HTMLCanvasElement,
  options?: GlobeOptions,
): GlobeController;
