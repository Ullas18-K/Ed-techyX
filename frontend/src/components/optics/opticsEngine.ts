import {
  OpticalObject,
  Lens,
  Mirror,
  OpticalElement,
  Ray,
  ImageData,
  Vector2D,
  LensType,
  MirrorType,
} from './types';
import {
  vec,
  createRay,
  rayLineIntersection,
  raySphereIntersection,
  refract,
  computeImageDistance,
  computeMagnification,
} from './ray';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;
const PRINCIPAL_AXIS_Y = CANVAS_HEIGHT / 2;

/**
 * Core physics engine for geometric optics
 */
export class OpticsEngine {
  /**
   * Generate principal rays from object through optical element
   */
  static generateRays(
    object: OpticalObject,
    element: OpticalElement,
    numRays: number = 5
  ): Ray[] {
    const rays: Ray[] = [];
    const isLens = 'refractiveIndex' in element;
    
    // Generate rays from different heights on the object
    for (let i = 0; i <= numRays; i++) {
      const fraction = i / numRays;
      const rayOrigin: Vector2D = {
        x: object.position.x,
        y: object.position.y - object.height * fraction,
      };
      
      // Create different types of rays
      if (i === 0) {
        // Ray from tip parallel to principal axis
        rays.push(
          createRay(rayOrigin, { x: 1, y: 0 }, 'parallel', '#ff6b6b')
        );
      } else if (i === numRays) {
        // Ray from base
        rays.push(
          createRay(rayOrigin, { x: 1, y: 0 }, 'marginal', '#4ecdc4')
        );
      } else {
        // Principal rays
        const direction = vec.normalize(
          vec.subtract(element.position, rayOrigin)
        );
        rays.push(
          createRay(rayOrigin, direction, 'principal', '#95e1d3')
        );
      }
    }
    
    return rays;
  }
  
  /**
   * Trace a single ray through a lens
   */
  static traceLensPrincipalRays(
    object: OpticalObject,
    lens: Lens
  ): { rays: Ray[]; imagePosition: Vector2D | null }[] {
    const results: { rays: Ray[]; imagePosition: Vector2D | null }[] = [];
    
    // Three principal rays for a lens
    const objectTip: Vector2D = {
      x: object.position.x,
      y: object.position.y - object.height,
    };
    
    // Ray 1: Parallel to principal axis, refracts through far focal point
    const ray1Origin = objectTip;
    const ray1Dir = { x: 1, y: 0 };
    const ray1 = createRay(ray1Origin, ray1Dir, 'parallel', '#ff6b6b');
    
    // Intersection with lens
    const intersection1 = rayLineIntersection(
      ray1,
      lens.position.x,
      lens.position.y - lens.diameter / 2,
      lens.position.y + lens.diameter / 2
    );
    
    if (intersection1) {
      // After lens, ray goes through focal point
      const focalPoint: Vector2D = {
        x: lens.position.x + lens.focalLength,
        y: PRINCIPAL_AXIS_Y,
      };
      const refractedDir = vec.normalize(
        vec.subtract(focalPoint, intersection1.point)
      );
      const refractedRay = createRay(
        intersection1.point,
        refractedDir,
        'parallel',
        '#ff6b6b'
      );
      results.push({ rays: [ray1, refractedRay], imagePosition: null });
    }
    
    // Ray 2: Through optical center (no deviation)
    const ray2Dir = vec.normalize(vec.subtract(lens.position, objectTip));
    const ray2 = createRay(objectTip, ray2Dir, 'principal', '#4ecdc4');
    
    const intersection2 = rayLineIntersection(
      ray2,
      lens.position.x,
      lens.position.y - lens.diameter / 2,
      lens.position.y + lens.diameter / 2
    );
    
    if (intersection2) {
      // Continue in same direction after lens
      const continuedRay = createRay(
        intersection2.point,
        ray2.direction,
        'principal',
        '#4ecdc4'
      );
      results.push({ rays: [ray2, continuedRay], imagePosition: null });
    }
    
    // Ray 3: Through near focal point, emerges parallel
    const nearFocalPoint: Vector2D = {
      x: lens.position.x - lens.focalLength,
      y: PRINCIPAL_AXIS_Y,
    };
    const ray3Dir = vec.normalize(vec.subtract(nearFocalPoint, objectTip));
    const ray3 = createRay(objectTip, ray3Dir, 'focal', '#95e1d3');
    
    const intersection3 = rayLineIntersection(
      ray3,
      lens.position.x,
      lens.position.y - lens.diameter / 2,
      lens.position.y + lens.diameter / 2
    );
    
    if (intersection3) {
      // Emerges parallel to axis
      const parallelRay = createRay(
        intersection3.point,
        { x: 1, y: 0 },
        'focal',
        '#95e1d3'
      );
      results.push({ rays: [ray3, parallelRay], imagePosition: null });
    }
    
    return results;
  }
  
  /**
   * Trace rays through a mirror
   */
  static traceMirrorRays(
    object: OpticalObject,
    mirror: Mirror
  ): { rays: Ray[]; imagePosition: Vector2D | null }[] {
    const results: { rays: Ray[]; imagePosition: Vector2D | null }[] = [];
    
    const objectTip: Vector2D = {
      x: object.position.x,
      y: object.position.y - object.height,
    };
    
    if (mirror.type === 'plane') {
      // For plane mirror, simple reflection
      const ray = createRay(
        objectTip,
        vec.normalize(vec.subtract(mirror.position, objectTip)),
        'principal',
        '#ff6b6b'
      );
      
      const intersection = rayLineIntersection(
        ray,
        mirror.position.x,
        mirror.position.y - mirror.diameter / 2,
        mirror.position.y + mirror.diameter / 2
      );
      
      if (intersection) {
        const normal = { x: -1, y: 0 }; // Normal pointing left for plane mirror
        const reflected = vec.reflect(ray.direction, normal);
        const reflectedRay = createRay(
          intersection.point,
          reflected,
          'principal',
          '#ff6b6b'
        );
        results.push({ rays: [ray, reflectedRay], imagePosition: null });
      }
    } else {
      // Spherical mirror - use principal rays
      // Ray 1: Parallel to axis, reflects through focal point
      const ray1 = createRay(objectTip, { x: 1, y: 0 }, 'parallel', '#ff6b6b');
      
      // For curved mirror, we need to consider the curvature
      const mirrorCenter: Vector2D = {
        x: mirror.position.x + (mirror.type === 'concave' ? mirror.radiusOfCurvature : -mirror.radiusOfCurvature),
        y: mirror.position.y,
      };
      
      const intersection1 = rayLineIntersection(
        ray1,
        mirror.position.x,
        mirror.position.y - mirror.diameter / 2,
        mirror.position.y + mirror.diameter / 2
      );
      
      if (intersection1) {
        // Normal at intersection point
        const normal = vec.normalize(vec.subtract(mirrorCenter, intersection1.point));
        const reflected = vec.reflect(ray1.direction, normal);
        const reflectedRay = createRay(
          intersection1.point,
          reflected,
          'parallel',
          '#ff6b6b'
        );
        results.push({ rays: [ray1, reflectedRay], imagePosition: null });
      }
      
      // Ray 2: Through center of curvature, reflects back
      const ray2Dir = vec.normalize(vec.subtract(mirrorCenter, objectTip));
      const ray2 = createRay(objectTip, ray2Dir, 'principal', '#4ecdc4');
      
      const intersection2 = rayLineIntersection(
        ray2,
        mirror.position.x,
        mirror.position.y - mirror.diameter / 2,
        mirror.position.y + mirror.diameter / 2
      );
      
      if (intersection2) {
        const reflectedRay = createRay(
          intersection2.point,
          vec.multiply(ray2.direction, -1),
          'principal',
          '#4ecdc4'
        );
        results.push({ rays: [ray2, reflectedRay], imagePosition: null });
      }
    }
    
    return results;
  }
  
  /**
   * Calculate image properties using lens equation
   */
  static calculateImage(
    object: OpticalObject,
    element: OpticalElement
  ): ImageData | null {
    const objectDistance = Math.abs(element.position.x - object.position.x);
    
    if (objectDistance === 0) return null;
    
    // Determine if it's a lens or mirror
    const isLens = 'refractiveIndex' in element;
    let focalLength = element.focalLength;
    
    // Adjust focal length sign for concave elements
    if (element.type === 'concave') {
      focalLength = -Math.abs(focalLength);
    }
    
    // Calculate image distance using lens/mirror equation
    const imageDistance = computeImageDistance(objectDistance, focalLength);
    
    // Check if image is at infinity
    if (!isFinite(imageDistance)) {
      return null;
    }
    
    // Calculate magnification
    const magnification = computeMagnification(objectDistance, imageDistance);
    
    // Determine image position
    const imageX = element.position.x + imageDistance;
    const imageY = PRINCIPAL_AXIS_Y;
    
    // Image height
    const imageHeight = Math.abs(object.height * magnification);
    
    // Determine if image is real or virtual
    const isReal = imageDistance > 0;
    
    // Determine if image is inverted
    const isInverted = magnification < 0;
    
    return {
      position: { x: imageX, y: imageY },
      height: imageHeight,
      isReal,
      isInverted,
      magnification: Math.abs(magnification),
    };
  }
  
  /**
   * Find intersection point of two rays (for image formation)
   */
  static findRayIntersection(ray1: Ray, ray2: Ray): Vector2D | null {
    const x1 = ray1.origin.x;
    const y1 = ray1.origin.y;
    const x2 = ray1.origin.x + ray1.direction.x * 1000;
    const y2 = ray1.origin.y + ray1.direction.y * 1000;
    
    const x3 = ray2.origin.x;
    const y3 = ray2.origin.y;
    const x4 = ray2.origin.x + ray2.direction.x * 1000;
    const y4 = ray2.origin.y + ray2.direction.y * 1000;
    
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    
    if (Math.abs(denom) < 0.001) {
      return null; // Parallel rays
    }
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }
}
