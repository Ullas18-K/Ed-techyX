import { Task, OpticsState } from './types';

/**
 * Learning tasks for students to complete
 */
export const tasks: Task[] = [
  {
    id: 'task-1',
    title: 'Laws of Reflection',
    description: 'Change object position and observe that angle of reflection equals angle of incidence',
    instructions: [
      'Switch to Mirror mode',
      'Add a plane mirror',
      'Move the object up and down to change the angle of incidence',
      'Observe: Angle of reflection always equals angle of incidence',
      'This demonstrates the fundamental law of reflection',
    ],
    validationFn: (state: OpticsState): boolean => {
      const mirror = state.elements.find((el) => el.type === 'plane' && !('refractiveIndex' in el));
      if (!mirror || state.mode !== 'mirror') return false;
      
      // Check if rays are visible and object has been moved
      return state.showRays && state.rays.length > 0 && state.object.height !== 100;
    },
    completed: false,
    hint: 'Move the object vertically to change the incident angle and observe the reflected rays',
  },
  
  {
    id: 'task-2',
    title: 'Image in a Plane Mirror',
    description: 'Move the object and observe that image distance equals object distance',
    instructions: [
      'Keep the plane mirror in the scene',
      'Move the object closer to and farther from the mirror',
      'Observe: Image distance always equals object distance',
      'The image remains virtual and upright',
      'Try different positions to verify this relationship',
    ],
    validationFn: (state: OpticsState): boolean => {
      const mirror = state.elements.find((el) => el.type === 'plane');
      if (!mirror || !state.image || state.mode !== 'mirror') return false;
      
      const objectDistance = Math.abs(mirror.position.x - state.object.position.x);
      const imageDistance = Math.abs(state.image.position.x - mirror.position.x);
      
      // Image distance should equal object distance (within tolerance)
      return Math.abs(objectDistance - imageDistance) < 20 && !state.image.isReal;
    },
    completed: false,
    hint: 'Drag the object to different positions and watch the image move accordingly',
  },
  
  {
    id: 'task-3',
    title: 'Concave vs Convex Mirror',
    description: 'Compare how concave and convex mirrors form different types of images',
    instructions: [
      'First, add a concave mirror and move the object',
      'Observe: Concave mirror can form both real and virtual images',
      'Remove it, then add a convex mirror',
      'Observe: Convex mirror always forms virtual, upright, diminished images',
      'Notice the difference in image characteristics',
    ],
    validationFn: (state: OpticsState): boolean => {
      const convexMirror = state.elements.find((el) => el.type === 'convex' && !('refractiveIndex' in el));
      if (!convexMirror || state.mode !== 'mirror' || !state.image) return false;
      
      // Convex mirror should always form virtual, upright, diminished image
      return !state.image.isReal && !state.image.isInverted && state.image.magnification < 1;
    },
    completed: false,
    hint: 'Try both mirror types and observe how they form different types of images',
  },
  
  {
    id: 'task-4',
    title: 'Refraction of Light',
    description: 'Change the angle of incidence when light enters from air to glass',
    instructions: [
      'Switch to Lens mode',
      'Add a convex lens (represents glass)',
      'Adjust the angle of incidence slider',
      'Observe: Light bends towards the normal when entering denser medium',
      'The greater the angle of incidence, the more bending occurs',
    ],
    validationFn: (state: OpticsState): boolean => {
      const lens = state.elements.find((el) => 'refractiveIndex' in el);
      if (!lens || state.mode !== 'lens') return false;
      
      // Check if rays are present and angle has been adjusted
      return state.rays.length > 0 && state.angleOfIncidence > 0;
    },
    completed: false,
    hint: 'Use the angle slider and observe how rays bend when passing through the lens',
  },
  
  {
    id: 'task-5',
    title: 'Effect of Refractive Index',
    description: 'Change refractive index and observe how light bending changes',
    instructions: [
      'Add a convex lens if not already present',
      'Change the refractive index from 1.3 → 1.5 → 1.7',
      'Observe: Higher refractive index causes greater bending',
      'This is why different materials (water, glass, diamond) bend light differently',
      'Watch how the focal point position changes',
    ],
    validationFn: (state: OpticsState): boolean => {
      const lens = state.elements.find((el) => 'refractiveIndex' in el) as any;
      if (!lens || state.mode !== 'lens') return false;
      
      // Check if refractive index has been changed from default 1.5
      return lens.refractiveIndex !== 1.5 && state.rays.length > 0;
    },
    completed: false,
    hint: 'Use the Refractive Index slider to change the value and see how rays bend differently',
  },
  
  {
    id: 'task-6',
    title: 'Total Internal Reflection',
    description: 'Increase angle beyond critical angle to observe total internal reflection',
    instructions: [
      'This is an advanced concept (simulated)',
      'With a lens in place, increase the angle of incidence beyond 45°',
      'In real scenarios, light traveling from glass to air can be completely reflected',
      'When angle > critical angle, refraction stops and reflection occurs',
      'This principle is used in optical fibers',
    ],
    validationFn: (state: OpticsState): boolean => {
      const lens = state.elements.find((el) => 'refractiveIndex' in el);
      if (!lens) return false;
      
      // Check if angle is high (simulating critical angle condition)
      return state.angleOfIncidence > 45 && state.rays.length > 0;
    },
    completed: false,
    hint: 'Increase the angle of incidence slider above 45° to simulate critical angle conditions',
  },
  
  {
    id: 'task-7',
    title: 'Image Formation by Lenses',
    description: 'Compare convex and concave lens image formation',
    instructions: [
      'Add a convex lens and move the object to different positions',
      'Observe: Convex lens can form both real and virtual images',
      'When object is beyond focal point: real, inverted image',
      'When object is within focal point: virtual, upright, magnified image',
      'Remove and add concave lens: always forms virtual, upright, diminished image',
    ],
    validationFn: (state: OpticsState): boolean => {
      const concaveLens = state.elements.find((el) => el.type === 'concave' && 'refractiveIndex' in el);
      if (!concaveLens || state.mode !== 'lens' || !state.image) return false;
      
      // Concave lens should form virtual, upright, diminished image
      return !state.image.isReal && !state.image.isInverted && state.image.magnification < 1;
    },
    completed: false,
    hint: 'Try both convex and concave lenses at different object positions',
  },
  
  {
    id: 'task-8',
    title: 'Magnification',
    description: 'Change object distance and observe how image size changes',
    instructions: [
      'Add a convex lens',
      'Start with object far from lens (beyond 2F)',
      'Observe: Image is diminished (M < 1)',
      'Move object between F and 2F',
      'Observe: Image is magnified (M > 1)',
      'This explains how magnifying glasses and projectors work',
    ],
    validationFn: (state: OpticsState): boolean => {
      const lens = state.elements.find((el) => el.type === 'convex' && 'refractiveIndex' in el);
      if (!lens || !state.image || state.mode !== 'lens') return false;
      
      const objectDistance = Math.abs(lens.position.x - state.object.position.x);
      const focalLength = Math.abs(lens.focalLength);
      
      // Check if object is positioned to show magnification effect
      return objectDistance > focalLength && objectDistance < 2 * focalLength && state.image.magnification > 1;
    },
    completed: false,
    hint: 'Position the object between F and 2F to see magnification greater than 1',
  },
];
