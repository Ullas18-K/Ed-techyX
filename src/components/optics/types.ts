// Type definitions for the Geometric Optics simulation

export interface Vector2D {
  x: number;
  y: number;
}

export interface Ray {
  origin: Vector2D;
  direction: Vector2D;
  color: string;
  type: 'principal' | 'focal' | 'parallel' | 'marginal';
  intensity: number;
}

export interface Intersection {
  point: Vector2D;
  normal: Vector2D;
  distance: number;
}

export type ObjectType = 'candle' | 'arrow' | 'pencil';
export type LensType = 'convex' | 'concave';
export type MirrorType = 'plane' | 'concave' | 'convex';
export type OpticalElementType = LensType | MirrorType;

export interface OpticalObject {
  type: ObjectType;
  position: Vector2D;
  height: number;
  width: number;
}

export interface Lens {
  id: string;
  type: LensType;
  position: Vector2D;
  focalLength: number;
  diameter: number;
  refractiveIndex: number;
  radiusOfCurvature: number;
}

export interface Mirror {
  id: string;
  type: MirrorType;
  position: Vector2D;
  focalLength: number;
  diameter: number;
  radiusOfCurvature: number;
}

export type OpticalElement = Lens | Mirror;

export interface ImageData {
  position: Vector2D;
  height: number;
  isReal: boolean;
  isInverted: boolean;
  magnification: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  validationFn: (state: OpticsState) => boolean;
  completed: boolean;
  hint: string;
}

export interface OpticsState {
  object: OpticalObject;
  elements: OpticalElement[];
  rays: Ray[];
  image: ImageData | null;
  showRays: boolean;
  showFocalPoints: boolean;
  showVirtualImage: boolean;
  showLabels: boolean;
  showNormal: boolean;
  showRayExtensions: boolean;
  showMeasurements: boolean;
  showFormula: boolean;
  angleOfIncidence: number;
  mode: 'lens' | 'mirror';
  activeTaskId: string | null;
  completedTasks: string[];
}
