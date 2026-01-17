import { Vector2D, Ray, Intersection } from './types';

/**
 * Utility functions for vector mathematics
 */
export const vec = {
  add: (a: Vector2D, b: Vector2D): Vector2D => ({ x: a.x + b.x, y: a.y + b.y }),
  
  subtract: (a: Vector2D, b: Vector2D): Vector2D => ({ x: a.x - b.x, y: a.y - b.y }),
  
  multiply: (v: Vector2D, scalar: number): Vector2D => ({ x: v.x * scalar, y: v.y * scalar }),
  
  divide: (v: Vector2D, scalar: number): Vector2D => ({ x: v.x / scalar, y: v.y / scalar }),
  
  magnitude: (v: Vector2D): number => Math.sqrt(v.x * v.x + v.y * v.y),
  
  normalize: (v: Vector2D): Vector2D => {
    const mag = vec.magnitude(v);
    return mag > 0 ? vec.divide(v, mag) : { x: 0, y: 0 };
  },
  
  dot: (a: Vector2D, b: Vector2D): number => a.x * b.x + a.y * b.y,
  
  distance: (a: Vector2D, b: Vector2D): number => vec.magnitude(vec.subtract(b, a)),
  
  angle: (v: Vector2D): number => Math.atan2(v.y, v.x),
  
  fromAngle: (angle: number, magnitude: number = 1): Vector2D => ({
    x: Math.cos(angle) * magnitude,
    y: Math.sin(angle) * magnitude,
  }),
  
  reflect: (incident: Vector2D, normal: Vector2D): Vector2D => {
    const dot = vec.dot(incident, normal);
    return vec.subtract(incident, vec.multiply(normal, 2 * dot));
  },
  
  rotate: (v: Vector2D, angle: number): Vector2D => ({
    x: v.x * Math.cos(angle) - v.y * Math.sin(angle),
    y: v.x * Math.sin(angle) + v.y * Math.cos(angle),
  }),
};

/**
 * Create a ray from origin in direction
 */
export function createRay(
  origin: Vector2D,
  direction: Vector2D,
  type: Ray['type'] = 'principal',
  color: string = '#ff6b6b'
): Ray {
  return {
    origin,
    direction: vec.normalize(direction),
    color,
    type,
    intensity: 1.0,
  };
}

/**
 * Compute the intersection of a ray with a vertical line (lens/mirror)
 */
export function rayLineIntersection(
  ray: Ray,
  lineX: number,
  minY: number,
  maxY: number
): Intersection | null {
  // Ray equation: P = origin + t * direction
  // Line equation: x = lineX
  
  if (Math.abs(ray.direction.x) < 0.0001) {
    return null; // Ray is parallel to line
  }
  
  const t = (lineX - ray.origin.x) / ray.direction.x;
  
  if (t < 0) {
    return null; // Intersection is behind ray origin
  }
  
  const intersectionPoint = vec.add(ray.origin, vec.multiply(ray.direction, t));
  
  // Check if intersection is within line bounds
  if (intersectionPoint.y < minY || intersectionPoint.y > maxY) {
    return null;
  }
  
  return {
    point: intersectionPoint,
    normal: { x: 1, y: 0 }, // Normal pointing right for vertical line
    distance: t,
  };
}

/**
 * Compute the intersection of a ray with a circle (curved mirror)
 */
export function raySphereIntersection(
  ray: Ray,
  center: Vector2D,
  radius: number
): Intersection | null {
  const oc = vec.subtract(ray.origin, center);
  const a = vec.dot(ray.direction, ray.direction);
  const b = 2.0 * vec.dot(oc, ray.direction);
  const c = vec.dot(oc, oc) - radius * radius;
  const discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0) {
    return null; // No intersection
  }
  
  const t1 = (-b - Math.sqrt(discriminant)) / (2.0 * a);
  const t2 = (-b + Math.sqrt(discriminant)) / (2.0 * a);
  
  const t = t1 > 0 ? t1 : t2;
  
  if (t < 0) {
    return null;
  }
  
  const point = vec.add(ray.origin, vec.multiply(ray.direction, t));
  const normal = vec.normalize(vec.subtract(point, center));
  
  return {
    point,
    normal,
    distance: t,
  };
}

/**
 * Apply Snell's Law to compute refracted ray direction
 * n1 * sin(θ1) = n2 * sin(θ2)
 */
export function refract(
  incident: Vector2D,
  normal: Vector2D,
  n1: number,
  n2: number
): Vector2D | null {
  const incidentNorm = vec.normalize(incident);
  const normalNorm = vec.normalize(normal);
  
  const cosI = -vec.dot(normalNorm, incidentNorm);
  const sinT2 = (n1 / n2) * (n1 / n2) * (1.0 - cosI * cosI);
  
  if (sinT2 > 1.0) {
    return null; // Total internal reflection
  }
  
  const cosT = Math.sqrt(1.0 - sinT2);
  const refracted = vec.add(
    vec.multiply(incidentNorm, n1 / n2),
    vec.multiply(normalNorm, n1 / n2 * cosI - cosT)
  );
  
  return vec.normalize(refracted);
}

/**
 * Compute lens equation: 1/f = 1/do + 1/di
 */
export function computeImageDistance(objectDistance: number, focalLength: number): number {
  if (Math.abs(objectDistance - focalLength) < 0.001) {
    return Infinity; // Object at focal point
  }
  return (focalLength * objectDistance) / (objectDistance - focalLength);
}

/**
 * Compute magnification: M = -di / do
 */
export function computeMagnification(objectDistance: number, imageDistance: number): number {
  return -imageDistance / objectDistance;
}

/**
 * Compute focal length from radius of curvature
 * For mirrors: f = R / 2
 * For lenses (thin lens): 1/f = (n-1)(1/R1 - 1/R2)
 */
export function computeFocalLengthFromRadius(
  radius: number,
  type: 'lens' | 'mirror',
  refractiveIndex: number = 1.5
): number {
  if (type === 'mirror') {
    return radius / 2;
  } else {
    // Thin lens approximation with symmetric surfaces
    return radius / (2 * (refractiveIndex - 1));
  }
}

/**
 * Check if a point is within a rectangle
 */
export function isPointInRect(
  point: Vector2D,
  rectPos: Vector2D,
  width: number,
  height: number
): boolean {
  return (
    point.x >= rectPos.x &&
    point.x <= rectPos.x + width &&
    point.y >= rectPos.y &&
    point.y <= rectPos.y + height
  );
}

/**
 * Check if a point is near a circle
 */
export function isPointNearCircle(
  point: Vector2D,
  center: Vector2D,
  radius: number,
  threshold: number = 10
): boolean {
  const dist = vec.distance(point, center);
  return Math.abs(dist - radius) <= threshold;
}
