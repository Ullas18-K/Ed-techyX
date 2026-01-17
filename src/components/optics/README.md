# Geometric Optics Simulation

A production-grade interactive geometric optics simulation built with React, TypeScript, and HTML5 Canvas. This module provides a PhET-style interactive learning experience for students to explore ray optics, lenses, and mirrors.

## 🎯 Features

### Physics Engine
- **Real Ray Tracing**: Implements actual geometric optics, not fake animations
- **Snell's Law**: Accurate refraction calculations for lenses
- **Thin Lens Equation**: `1/f = 1/do + 1/di`
- **Magnification**: `M = -di / do`
- **Law of Reflection**: For plane and spherical mirrors
- **Spherical Mirror Equations**: Proper focal length calculations

### Interactive Elements
- **Draggable Objects**: Move candle, arrow, or pencil objects
- **Optical Elements**:
  - Convex Lens (converging)
  - Concave Lens (diverging)
  - Plane Mirror
  - Concave Mirror
  - Convex Mirror
- **Real-time Parameters**:
  - Object distance
  - Object height
  - Focal length
  - Radius of curvature
  - Lens diameter
  - Refractive index

### Visual Features
- **60 FPS Canvas Rendering**
- **Principal Rays**: Parallel, focal, and central rays
- **Focal Points**: F, F', 2F, 2F' marked clearly
- **Real & Virtual Images**: Properly displayed
- **Image Properties**: Magnification, orientation, type
- **Grid & Axis**: Visual reference guides

### Learning Tasks (Gamified)
1. **Find the Focal Length**: Place object at focal point to make rays parallel
2. **Real vs Virtual**: Observe image transition across focal point
3. **Image at Infinity**: Position object for image at infinity
4. **Magnification Challenge**: Achieve exactly 2x magnification
5. **Mirror Mastery**: Create inverted real image with concave mirror

## 🚀 Quick Start

### Basic Usage

```tsx
import { GeometricOptics } from '@/components/optics';

function App() {
  return <GeometricOptics />;
}
```

### Accessing the Store

```tsx
import { useOpticsStore } from '@/components/optics';

function CustomComponent() {
  const { object, elements, image } = useOpticsStore();
  
  return (
    <div>
      <p>Object Distance: {elements[0]?.position.x - object.position.x}</p>
      {image && <p>Magnification: {image.magnification}</p>}
    </div>
  );
}
```

## 📁 File Structure

```
src/components/optics/
├── index.ts                  # Main exports
├── types.ts                  # TypeScript type definitions
├── opticsStore.ts           # Zustand state management
├── opticsEngine.ts          # Physics calculations
├── ray.ts                   # Ray tracing & vector math
├── scene.ts                 # Canvas rendering engine
├── interactions.ts          # Drag & drop handlers
├── tasks.ts                 # Learning challenges
└── GeometricOptics.tsx      # Main React component
```

## 🔬 Physics Implementation

### Lens Equation
```
1/f = 1/do + 1/di

Where:
- f = focal length
- do = object distance
- di = image distance
```

### Magnification
```
M = -di / do = hi / ho

Where:
- M = magnification
- hi = image height
- ho = object height
```

### Snell's Law
```
n1 * sin(θ1) = n2 * sin(θ2)

Used for ray refraction through lenses
```

### Mirror Focal Length
```
f = R / 2

Where:
- f = focal length
- R = radius of curvature
```

## 🎮 User Interactions

### Mouse Controls
- **Click & Drag**: Move objects and optical elements
- **Sliders**: Adjust parameters in real-time
- **Buttons**: Add/remove elements, switch modes

### Touch Controls
- Full touch support for mobile devices
- Pinch and drag gestures

## 🎨 Rendering Pipeline

1. **Clear Canvas**: Fill with dark background
2. **Draw Grid**: Optional reference grid
3. **Draw Principal Axis**: Horizontal optical axis
4. **Draw Optical Elements**: Lenses/mirrors with focal points
5. **Draw Rays**: Incident and refracted/reflected rays
6. **Draw Object**: Candle, arrow, or pencil
7. **Draw Image**: Real (solid) or virtual (dashed)
8. **Draw Labels**: F, F', 2F, magnification info

## 🧮 Task System

Each task includes:
- **Title & Description**: Clear learning objective
- **Instructions**: Step-by-step guide
- **Validation Function**: Automatic completion detection
- **Hint**: Helpful tip for students
- **Visual Feedback**: Highlighting and success notifications

### Example Task

```typescript
{
  id: 'task-1',
  title: 'Find the Focal Length',
  description: 'Place the object so that rays become parallel',
  validationFn: (state: OpticsState) => {
    const lens = state.elements.find(el => el.type === 'convex');
    const objectDistance = Math.abs(lens.position.x - state.object.position.x);
    return Math.abs(objectDistance - lens.focalLength) < 10;
  },
  hint: 'Move object closer or farther until rays are parallel'
}
```

## 🎯 Performance

- **60 FPS Target**: Achieved through requestAnimationFrame
- **Decoupled Physics**: Physics calculations separate from rendering
- **Optimized Canvas**: Efficient drawing with minimal redraws
- **No External Physics Engine**: Lightweight custom implementation

## 🔧 Customization

### Add Custom Objects

```typescript
const customObject: OpticalObject = {
  type: 'custom',
  position: { x: 200, y: 300 },
  height: 100,
  width: 30,
};
```

### Create Custom Tasks

```typescript
const customTask: Task = {
  id: 'custom-1',
  title: 'My Custom Task',
  description: 'Learn something new',
  instructions: ['Step 1', 'Step 2'],
  validationFn: (state) => {
    // Your validation logic
    return true;
  },
  hint: 'Helpful hint',
};
```

### Extend Rendering

```typescript
class CustomRenderer extends OpticsRenderer {
  drawCustomElement() {
    // Custom drawing logic
  }
}
```

## 🐛 Debugging

### Enable Debug Mode

```typescript
const debug = true;

if (debug) {
  console.log('Object:', object);
  console.log('Elements:', elements);
  console.log('Rays:', rays);
  console.log('Image:', image);
}
```

### Visual Debug Helpers

The renderer can show:
- Grid overlay
- Ray origins and directions
- Intersection points
- Normal vectors
- Focal points

## 📚 Educational Value

This simulation teaches:
- **Ray Optics**: How light behaves through lenses and mirrors
- **Image Formation**: Real vs virtual, inverted vs upright
- **Magnification**: How image size relates to object distance
- **Focal Length**: The most important lens/mirror property
- **Optical Axis**: Reference for measurements
- **Sign Conventions**: Positive/negative distances

## 🚀 Future Enhancements

Potential additions:
- Multiple optical elements in series
- Chromatic aberration simulation
- Spherical aberration
- More object types (point source, extended objects)
- Save/load configurations
- Export diagrams as images
- Animation of object movement
- 3D visualization option

## 📖 References

- [PhET Geometric Optics Simulation](https://phet.colorado.edu/en/simulations/geometric-optics)
- [Optics Textbook by Hecht](https://www.pearson.com/en-us/subject-catalog/p/optics/P200000005923)
- [Thin Lens Equation - HyperPhysics](http://hyperphysics.phy-astr.gsu.edu/hbase/geoopt/lenseq.html)

## 📄 License

Part of the EdTech Learning Platform. See main project LICENSE.

## 👨‍💻 Author

Built for interactive STEM education.

---

**Happy Learning! 🎓✨**
