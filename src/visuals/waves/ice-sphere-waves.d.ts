export interface IceWavesOptions {
  speed?: number;
  paused?: boolean;
}
export interface IceWavesStats {
  supported: boolean;
  running?: boolean;
  width?: number;
  height?: number;
  frames?: number;
  phase?: number;
  renderMs?: number;
  targetFps?: number;
}
export interface IceWavesController {
  update(options?: IceWavesOptions): void;
  destroy(): void;
  getStats(): IceWavesStats;
}
export function createIceWaves(
  canvas: HTMLCanvasElement,
  options?: IceWavesOptions,
): IceWavesController;
