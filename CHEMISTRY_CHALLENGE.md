# Chemistry Challenge - Gamified Learning

## 🎮 Overview

A 3-level gamified chemistry puzzle following the **exact architecture** of the Ray Optics Challenge. This game tests students' understanding of **Acids, Bases & Salts** (Class 10 NCERT) through logic-based challenges.

---

## 🎯 Game Structure

### **Architecture**: Identical to Ray Optics Challenge
- Same UI layout
- Same canvas size
- Same scoring system
- Same Penman behavior
- Same level progression
- Same confetti celebration

### **Route**: `/chemistry-challenge`

---

## 🧪 Level Breakdown

### **Level 1: Identify the Substance**

**Concepts Covered**:
- Acids vs Bases vs Neutral
- Indicators (litmus, phenolphthalein)
- Color changes

**Scene**:
- 3 unlabeled test tubes on lab table
- Solution 1 = Acid (HCl)
- Solution 2 = Base (NaOH)
- Solution 3 = Neutral (Water)

**Controls**:
1. Select Indicator (Blue Litmus / Red Litmus / Phenolphthalein)
2. Test Solutions (buttons 1, 2, 3)
3. Label Solutions (dropdown: Acid/Base/Neutral)

**Goal**: Correctly identify all 3 solutions

**Validation**:
```typescript
solution1 === 'acid' && solution2 === 'base' && solution3 === 'neutral'
```

**Hint**: "Blue litmus turns red in acid. Red litmus turns blue in base. Phenolphthalein turns pink in base."

**Visual Feedback**:
- Blue Litmus + Acid → Red
- Red Litmus + Base → Blue
- Phenolphthalein + Base → Pink
- Tested solutions show color change

---

### **Level 2: The Gas Mystery**

**Concepts Covered**:
- Acid + Metal → Hydrogen
- Acid + Carbonate → CO₂
- Gas identification tests

**Scene**:
- Test tube with delivery tube
- Limewater container
- Burning splint (for pop test)

**Controls**:
1. Choose Reactants (Zinc / Sodium Carbonate)
2. Add Acid (HCl button)
3. Perform Gas Test (Pop Test / Limewater Test)
4. Identify Gas (H₂ / CO₂ buttons)

**Goal**: Identify the gas produced from the chosen reaction

**Validation**:
- Zn + HCl → H₂ (requires pop test)
- Na₂CO₃ + HCl → CO₂ (requires limewater test)

**Hint**: "Metals + Acid produce Hydrogen (burns with pop). Carbonates + Acid produce CO2 (turns limewater milky)."

**Visual Feedback**:
- Bubbles appear when reactants mix
- Pop test shows flame icon
- Limewater turns milky with CO₂

---

### **Level 3: Neutralise the Lab**

**Concepts Covered**:
- Neutralization reaction
- pH scale
- Acid-base titration

**Scene**:
- Burette (filled with acid)
- Conical flask (filled with pink base + phenolphthalein)
- pH scale on right side

**Controls**:
1. Add Acid Dropwise (+1 Drop button)
2. Check pH (button)

**Goal**: Achieve pH 7 (neutral) with minimum drops

**Validation**:
```typescript
acidDrops === 5 && phChecked === true
```

**Hint**: "Start with strong base (pH 14). Each drop lowers pH. Neutral is pH 7."

**Visual Feedback**:
- Flask starts pink (pH 14)
- Color fades as acid is added
- Becomes transparent at pH 7
- pH value displayed when checked

---

## 🎮 Game Mechanics

### **Scoring System** (Same as Ray Optics)
- **Starting Score**: 60 points
- **Level Complete**: +30 points
- **Wrong Attempt**: -10 points
- **Hint Cost**: -10, -20, -30... (escalating)

### **Penman Behavior**
- Appears at game start
- Appears on wrong moves
- Provides hints (with penalty)
- Celebrates level completion
- Same position (bottom-right)
- Same animations

### **Level Progression**
1. Complete Level 1 → Unlock Level 2
2. Complete Level 2 → Unlock Level 3
3. Complete Level 3 → Confetti + Final Score

### **Failure Handling**
- Red flash on canvas
- Score penalty
- Penman warns
- Hint becomes available

---

## 🎨 Visual Design

### **Canvas Rendering**
- Dark lab background (#020617)
- Lab table at bottom (#1e293b)
- Test tubes with glass effect
- Animated bubbles for gas
- Color transitions for reactions
- pH scale gradient

### **UI Components**
- Glass-morphism cards
- Gradient borders
- Smooth animations
- Consistent with Ray Optics theme

---

## 🧠 Educational Value

### **Logic-Based Learning**
- No random guessing
- Requires concept understanding
- Limited moves force strategic thinking
- Penalties discourage trial-and-error

### **NCERT Alignment**
All reactions follow Class 10 NCERT Chemistry:
- Acid + Blue Litmus → Red
- Base + Red Litmus → Blue
- Base + Phenolphthalein → Pink
- Zn + HCl → H₂ (pop test)
- Na₂CO₃ + HCl → CO₂ (limewater milky)
- Acid + Base → pH 7

---

## 🚀 Technical Implementation

### **File Structure**
```
src/pages/gamified/ChemistryChallenge.tsx (main file)
```

### **Key Components**
1. **ConfettiRain** - Celebration animation
2. **PuzzlePenman** - AI guide component
3. **Level State Interfaces**:
   - `Level1State` - Indicator tests
   - `Level2State` - Gas identification
   - `Level3State` - Neutralization

### **Canvas Rendering**
- `renderLevel1()` - Test tubes + indicators
- `renderLevel2()` - Gas production setup
- `renderLevel3()` - Burette + flask titration

### **Validation Logic**
- Each level has a `correct()` function
- Checks exact state conditions
- No partial credit

---

## 🎯 Success Criteria

✅ **Follows Ray Optics Architecture Exactly**
✅ **3 Distinct Chemistry Levels**
✅ **NCERT-Accurate Reactions**
✅ **Logic-Based Gameplay**
✅ **Scoring & Penalties**
✅ **Penman Integration**
✅ **Confetti Celebration**
✅ **Multiplayer Score Sync**

---

## 🎓 How to Play

1. Navigate to `/chemistry-challenge`
2. Click "LET'S GO!" to start
3. Read the task description
4. Use controls to set up experiment
5. Click "TEST CONFIGURATION" to check
6. Complete all 3 levels
7. Celebrate with confetti!

---

## 🏆 Scoring Tips

- **Think before acting** - Wrong attempts cost 10 points
- **Use hints wisely** - They get expensive (10, 20, 30...)
- **Understand concepts** - No luck, only logic
- **Minimum moves** - Fewer steps = higher score

---

## 🎉 Final Score

After Level 3:
- Confetti animation
- Final score display
- "Back to Home" button
- "Continue" to reflection
- Score saved to learning store
- Multiplayer sync (if in study room)

---

**Built with ❤️ following Ray Optics Challenge architecture!**
