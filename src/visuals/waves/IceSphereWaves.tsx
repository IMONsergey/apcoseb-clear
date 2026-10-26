import { useEffect, useRef, type CSSProperties } from 'react';
import { createIceWaves, type IceWavesController } from './ice-sphere-waves-themed';
import './ice-sphere-waves.css';

interface IceSphereWavesProps {
  /** 0–3; 1 preserves the approved slow motion. */
  speed?: number;
  paused?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
  style?: CSSProperties;
}

function IceSphereWaves({
  speed = 1,
  paused = false,
  theme = 'light',
  className = '',
  style,
}: IceSphereWavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<IceWavesController | null>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const controller = createIceWaves(canvasRef.current);
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);
  useEffect(() => {
    controllerRef.current?.update({ speed, paused, theme });
  }, [speed, paused, theme]);
  return (
    <div className={`ice-sphere-waves ${className}`.trim()} style={style} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

export default IceSphereWaves;
