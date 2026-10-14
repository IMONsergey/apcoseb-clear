import { createContext, useContext } from 'react';
type MotionState = { paused: boolean; reduced: boolean };
export const MotionContext = createContext<MotionState>({ paused: false, reduced: false });
export const useMotion = () => useContext(MotionContext);
