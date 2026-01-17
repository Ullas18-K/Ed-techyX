/**
 * Example: Custom Optics Configurations
 * 
 * This file shows various ways to customize and extend the Geometric Optics simulation
 */

import { useOpticsStore } from './opticsStore';
import { Lens, Mirror, Task } from './types';

// ============================================================================
// Example 1: Programmatically Setup a Specific Configuration
// ============================================================================

export function setupTelescopeDemo() {
  const { addElement, setObjectPosition } = useOpticsStore.getState();
  
  // Add objective lens (convex, long focal length)
  const objectiveLens: Lens = {
    id: 'objective',
    type: 'convex',
    position: { x: 600, y: 300 },
    focalLength: 200,
    diameter: 200,
    refractiveIndex: 1.5,
    radiusOfCurvature: 400,
  };
  
  addElement(objectiveLens);
  
  // Position object far away (simulate distant star)
  setObjectPosition({ x: 100, y: 300 });
}

// ============================================================================
// Example 2: Custom Task for Advanced Students
// ============================================================================

export const advancedTask: Task = {
  id: 'advanced-1',
  title: 'Newton\'s Formula',
  description: 'Verify Newton\'s formula: f² = x·x\'',
  instructions: [
    'Add a convex lens with f = 100',
    'Measure distance from object to F: x = do - f',
    'Measure distance from F\' to image: x\' = di - f',
    'Verify that f² = x·x\'',
  ],
  validationFn: (state) => {
    const lens = state.elements.find((el) => el.type === 'convex');
    if (!lens || !state.image) return false;
    
    const f = Math.abs(lens.focalLength);
    const do_ = Math.abs(lens.position.x - state.object.position.x);
    const di = Math.abs(state.image.position.x - lens.position.x);
    
    const x = do_ - f;
    const xPrime = di - f;
    const fSquared = f * f;
    const product = x * xPrime;
    
    // Allow 5% tolerance
    return Math.abs(fSquared - product) / fSquared < 0.05;
  },
  completed: false,
  hint: 'Remember: x and x\' are distances from focal points, not from the lens',
};

// ============================================================================
// Example 3: Preset Configurations for Quick Demos
// ============================================================================

export const presetConfigurations = {
  // Simple magnifying glass
  magnifyingGlass: {
    element: {
      type: 'convex' as const,
      focalLength: 100,
      diameter: 180,
      position: { x: 500, y: 300 },
    },
    object: {
      position: { x: 450, y: 300 }, // Within focal length
      height: 60,
    },
    description: 'Virtual, upright, magnified image',
  },
  
  // Camera lens
  camera: {
    element: {
      type: 'convex' as const,
      focalLength: 80,
      diameter: 200,
      position: { x: 600, y: 300 },
    },
    object: {
      position: { x: 300, y: 300 }, // Beyond 2F
      height: 80,
    },
    description: 'Real, inverted, reduced image (like in cameras)',
  },
  
  // Projector
  projector: {
    element: {
      type: 'convex' as const,
      focalLength: 100,
      diameter: 220,
      position: { x: 600, y: 300 },
    },
    object: {
      position: { x: 450, y: 300 }, // Between F and 2F
      height: 50,
    },
    description: 'Real, inverted, magnified image (like in projectors)',
  },
  
  // Makeup mirror (concave)
  makeupMirror: {
    element: {
      type: 'concave' as const,
      focalLength: 100,
      diameter: 200,
      position: { x: 600, y: 300 },
    },
    object: {
      position: { x: 550, y: 300 }, // Within focal length
      height: 70,
    },
    description: 'Virtual, upright, magnified (like makeup mirrors)',
  },
  
  // Car side mirror (convex)
  sideMirror: {
    element: {
      type: 'convex' as const,
      focalLength: -100, // Negative for diverging
      diameter: 200,
      position: { x: 600, y: 300 },
    },
    object: {
      position: { x: 400, y: 300 },
      height: 70,
    },
    description: 'Virtual, upright, reduced (like car mirrors)',
  },
};

// ============================================================================
// Example 4: Apply Preset Configuration
// ============================================================================

export function applyPreset(presetName: keyof typeof presetConfigurations) {
  const preset = presetConfigurations[presetName];
  const { reset, addElement, setObjectPosition, setObjectHeight } = useOpticsStore.getState();
  
  // Reset first
  reset();
  
  // Add element
  if ('refractiveIndex' in preset.element) {
    // It's a lens
    const lens: Lens = {
      id: `preset-${presetName}`,
      type: preset.element.type as 'convex' | 'concave',
      position: preset.element.position,
      focalLength: preset.element.focalLength,
      diameter: preset.element.diameter,
      refractiveIndex: 1.5,
      radiusOfCurvature: preset.element.focalLength * 2,
    };
    addElement(lens);
  } else {
    // It's a mirror
    const mirror: Mirror = {
      id: `preset-${presetName}`,
      type: preset.element.type as any,
      position: preset.element.position,
      focalLength: preset.element.focalLength,
      diameter: preset.element.diameter,
      radiusOfCurvature: Math.abs(preset.element.focalLength) * 2,
    };
    addElement(mirror);
  }
  
  // Set object
  setObjectPosition(preset.object.position);
  setObjectHeight(preset.object.height);
  
  return preset.description;
}

// ============================================================================
// Example 5: Custom Drawing on Canvas (Advanced)
// ============================================================================

export function drawCustomAnnotation(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.save();
  
  // Draw annotation box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  
  const padding = 10;
  const width = ctx.measureText(text).width + padding * 2;
  const height = 30;
  
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  
  // Draw text
  ctx.fillStyle = '#00ff88';
  ctx.font = '14px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + padding, y + height / 2);
  
  ctx.restore();
}

// ============================================================================
// Example 6: Export Canvas as Image
// ============================================================================

export function exportCanvasAsImage(canvas: HTMLCanvasElement, filename: string = 'optics-diagram.png') {
  // Create download link
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ============================================================================
// Example 7: Real-World Applications Setup
// ============================================================================

export const realWorldApplications = {
  // Human eye
  eye: {
    setup: () => {
      const { reset, addElement } = useOpticsStore.getState();
      reset();
      
      const eyeLens: Lens = {
        id: 'eye-lens',
        type: 'convex',
        position: { x: 600, y: 300 },
        focalLength: 40, // Eye focal length ~17-20mm, scaled up
        diameter: 120,
        refractiveIndex: 1.4, // Approximate for eye lens
        radiusOfCurvature: 80,
      };
      
      addElement(eyeLens);
    },
    description: 'The human eye focuses light to form real, inverted images on the retina',
  },
  
  // Microscope objective
  microscope: {
    setup: () => {
      const { reset, addElement, setObjectPosition, setObjectHeight } = useOpticsStore.getState();
      reset();
      
      const objective: Lens = {
        id: 'microscope-objective',
        type: 'convex',
        position: { x: 600, y: 300 },
        focalLength: 50,
        diameter: 160,
        refractiveIndex: 1.5,
        radiusOfCurvature: 100,
      };
      
      addElement(objective);
      setObjectPosition({ x: 520, y: 300 }); // Just beyond F
      setObjectHeight(30); // Small object
    },
    description: 'Microscope objectives create highly magnified real images',
  },
};

// ============================================================================
// Example 8: Animated Demonstrations
// ============================================================================

export function animateObjectMovement(
  startX: number,
  endX: number,
  duration: number = 3000,
  onUpdate?: () => void
) {
  const { setObjectPosition, object } = useOpticsStore.getState();
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease in-out
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    const currentX = startX + (endX - startX) * eased;
    setObjectPosition({ x: currentX, y: object.position.y });
    
    if (onUpdate) onUpdate();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  animate();
}

// ============================================================================
// Example 9: Measurement Tools
// ============================================================================

export function measureOpticalSystem(state: ReturnType<typeof useOpticsStore.getState>) {
  const { object, elements, image } = state;
  
  if (elements.length === 0) {
    return null;
  }
  
  const element = elements[0];
  const objectDistance = Math.abs(element.position.x - object.position.x);
  
  return {
    objectDistance,
    focalLength: Math.abs(element.focalLength),
    imageDistance: image ? Math.abs(image.position.x - element.position.x) : null,
    magnification: image ? image.magnification : null,
    imageType: image?.isReal ? 'Real' : 'Virtual',
    imageOrientation: image?.isInverted ? 'Inverted' : 'Upright',
    // Derived values
    objectToFocalPointRatio: objectDistance / Math.abs(element.focalLength),
    isObjectBeyond2F: objectDistance > 2 * Math.abs(element.focalLength),
    isObjectBetweenFAnd2F: objectDistance > Math.abs(element.focalLength) && 
                           objectDistance < 2 * Math.abs(element.focalLength),
    isObjectAtF: Math.abs(objectDistance - Math.abs(element.focalLength)) < 10,
    isObjectWithinF: objectDistance < Math.abs(element.focalLength),
  };
}

// ============================================================================
// Example 10: Integration with React Components
// ============================================================================

// Use in a React component:
/*
import { applyPreset, presetConfigurations } from './OpticsExamples';

function OpticsDemo() {
  const handlePresetClick = (presetName: string) => {
    const description = applyPreset(presetName);
    toast.success(description);
  };
  
  return (
    <div>
      <h2>Real-World Applications</h2>
      {Object.keys(presetConfigurations).map((key) => (
        <button key={key} onClick={() => handlePresetClick(key)}>
          {key}
        </button>
      ))}
    </div>
  );
}
*/

// ============================================================================
// Export all examples
// ============================================================================

export default {
  setupTelescopeDemo,
  advancedTask,
  presetConfigurations,
  applyPreset,
  realWorldApplications,
  animateObjectMovement,
  measureOpticalSystem,
};
