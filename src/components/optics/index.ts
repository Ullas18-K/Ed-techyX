/**
 * Geometric Optics Simulation
 * 
 * A production-grade interactive ray tracing simulation for learning geometric optics.
 * Features:
 * - Real physics-based ray tracing using Snell's Law and lens equations
 * - Interactive drag-and-drop for objects and optical elements
 * - Support for convex/concave lenses and plane/spherical mirrors
 * - Real-time image calculation with proper magnification
 * - 5 gamified learning tasks with validation
 * - 60 FPS canvas rendering
 * 
 * Usage:
 * ```tsx
 * import { GeometricOptics } from './components/optics';
 * 
 * function App() {
 *   return <GeometricOptics />;
 * }
 * ```
 */

export { GeometricOptics } from './GeometricOptics';
export { DataLogger } from './DataLogger';
export { useOpticsStore } from './opticsStore';
export { OpticsEngine } from './opticsEngine';
export { OpticsRenderer } from './scene';
export { InteractionHandler } from './interactions';
export * from './types';
export { tasks } from './tasks';
