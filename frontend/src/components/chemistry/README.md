# Chemistry Simulation - Acids, Bases & Salts

## Overview
Interactive Chemistry simulation for Class 10 NCERT Chapter: Acids, Bases and Salts.

## Architecture
This simulation follows the **exact same architecture** as the Ray Optics simulation:

### Core Components
1. **ChemistrySim.tsx** - Main component (mirrors `GeometricOptics.tsx`)
2. **ChemistryCanvas.tsx** - Visual rendering layer
3. **chemistryStore.ts** - Zustand state management
4. **types.ts** - TypeScript type definitions
5. **tasks.ts** - Task definitions with validation
6. **penmanMessages.ts** - Penman guidance messages

### State Management
Uses Zustand store with:
- Global simulation state
- Experiment mode switching
- Chemical reactions logic
- Task tracking

## Experiment Modes

### 1. Indicators Mode
- Test acids and bases using indicators
- Litmus paper (red/blue)
- Phenolphthalein
- Color changes based on NCERT chemistry

### 2. Metal + Acid Reaction
- Add metals (Zn, Mg) to acids
- Observe H₂ gas production (bubbles)
- Pop test for hydrogen

### 3. Carbonate Reaction
- React carbonates with acids
- CO₂ gas production
- Lime water test (turns milky)

### 4. Neutralization
- Acid + Base titration
- Burette and flask setup
- pH indicator color change

### 5. pH Scale
- Universal indicator
- Visual pH scale (0-14)
- Test different solutions

### 6. Salt Heating
- Heat hydrated copper sulfate
- Water of crystallization removal
- Color change: Blue → White

## Canvas Layout
**SAME SIZE AS RAY OPTICS**: 1200x600 (defined in UnifiedSimulationLayout)

### Visual Elements
- Test tubes, flasks, burette
- Animated bubbles for gas production
- Color transitions for reactions
- pH scale gradient
- Lime water container
- Bunsen burner flame

## Controls
Dynamic controls based on experiment mode:
- Chemical selection buttons
- Indicator selection
- Metal selection
- Heat control (hold to heat)
- Reset button

## Task System
6 tasks covering the entire chapter:
1. Indicator tests
2. Metal reactions
3. Carbonate reactions
4. Neutralization
5. pH measurement
6. Salt heating

Each task:
- Has setup function
- Has validation function
- Locks until previous task complete
- Auto-advances on completion

## Reaction Engine
Located in `ChemistryCanvas.tsx` useEffect:
- Monitors state changes
- Applies NCERT-accurate chemistry rules
- Updates visual state (color, bubbles, etc.)
- No unrealistic reactions allowed

## Integration
- Uses `UnifiedSimulationLayout` (same as Optics)
- Penman AI integration via `usePenmanAI` hook
- Task sidebar with locking logic
- Data logger for observations

## Route
`/chemistry` - Renders ChemistryPage → ChemistrySim

## Future Enhancements
- More salts and metals
- Temperature tracking
- Concentration controls
- More complex reactions
