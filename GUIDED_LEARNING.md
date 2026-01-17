# Guided Learning System

## Overview
The simulation now features an **intelligent guided learning system** that automatically tracks your progress and completes tasks based on your actual learning actions.

## How It Works

### 🎯 Learning Steps
Instead of manually clicking checkboxes, the system now has **5 progressive learning steps** that auto-complete as you learn:

1. **Explore the Controls** (10 seconds)
   - Get familiar with all available simulation controls
   - Automatically completes after spending time exploring

2. **Run Your First Experiment** (1 experiment)
   - Adjust parameters and click "Run Experiment"
   - Completes after your first successful experiment

3. **Test Extremes** (3 experiments)
   - Try minimum and maximum values to understand limits
   - Completes after running 3 experiments

4. **Find Optimal Conditions** (Achievement-based)
   - Balance all factors to maximize outputs (e.g., plant health > 80%)
   - Completes when you achieve optimal results

5. **Understand Cause and Effect** (5 experiments)
   - Observe how changing factors impacts outputs
   - Completes after thorough experimentation

### ✨ Automatic Task Completion

**What triggers completion:**
- **Time spent**: Simply interacting with controls for the required time
- **Experiments run**: Clicking "Run Experiment" and observing results
- **Value achievements**: Reaching target output values (e.g., health > 80%)
- **Observations**: Running enough experiments to understand patterns

**What you'll see:**
- ✅ **Toast notifications** when you complete each step
- 🎯 **Progress bar** showing your journey through all steps
- ⭐ **+15 points** awarded automatically for each completed step
- 🔄 **Auto-advance** to the next step after completion

### 🎓 Learning Progression

The system enforces **sequential learning**:
- Steps unlock one at a time
- Current step is highlighted with a pulsing animation
- Future steps are locked until you complete prerequisites
- You can't skip ahead - ensures comprehensive understanding

### 📊 Visual Feedback

**Progress Indicators:**
- Top progress bar shows overall completion percentage
- Step indicators show completed (✅), current (✨), and locked (○) states
- Current step displays a glowing animation
- Step labels show your position (Step 1, Step 2, etc.)

**Learning Cards:**
- Green border when completed
- Blue glow when current task
- Dimmed appearance when locked
- Descriptive text explains what to do

### 🔔 Smart Notifications

You'll receive real-time feedback:
```
✅ Explore the Controls completed! +15 points
   Next: Run Your First Experiment
```

### 💡 Pro Tips

1. **Take Your Time**: Don't rush - the system tracks quality learning
2. **Experiment Thoroughly**: Running more experiments helps you understand better
3. **Aim for Excellence**: Try to achieve optimal results (80%+ health/outputs)
4. **Read Descriptions**: Each step's description guides you on what to do
5. **Watch the Glow**: The current step pulses - focus on completing it

### 🎮 Interaction Tracking

The system intelligently tracks:
- **Slider adjustments**: Each control change adds 2 seconds to exploration time
- **Experiment runs**: Every "Run Experiment" click increments your count
- **Result values**: Monitors output metrics like health, oxygen, efficiency
- **Background timer**: Automatically checks progress every 2 seconds

### 🏆 Points System

**Enhanced Rewards:**
- ✨ **+15 points** per learning step (5 steps = 75 points total)
- 🎯 Old system: Manual task completion still available
- 📈 Points accumulate and sync to leaderboard in real-time

### 🚀 Continue When Ready

Once you complete **3 or more steps**, the "Continue to Explanation" button appears. You've demonstrated sufficient understanding to move forward!

---

## Technical Implementation

### Architecture
```typescript
interface LearningStep {
  id: string;
  title: string;
  description: string;
  type: 'explore' | 'experiment' | 'observe' | 'analyze' | 'validate';
  completed: boolean;
  validationCriteria?: {
    type: 'value_check' | 'experiment_run' | 'observation' | 'time_spent';
    target?: string;
    threshold?: number;
  };
}
```

### Validation Types
- **experiment_run**: Checks if experiment count ≥ threshold
- **value_check**: Verifies simulation output reaches target value
- **time_spent**: Ensures minimum interaction duration
- **observation**: Validates user has observed results

### State Management
- `learningSteps[]`: Array of all learning steps
- `currentStepIndex`: Which step user is on
- `experimentCount`: Total experiments run
- `timeSpentInSimulation`: Seconds spent interacting
- Auto-completion via `checkStepCompletion()` every 2 seconds

---

**Enjoy your guided learning experience! 🚀**
