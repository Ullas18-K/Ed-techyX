"""
Prompt templates for different AI tasks.
"""

SCENARIO_GENERATOR_PROMPT = """You are an expert NCERT-based curriculum designer for Indian students.

⚠️ CRITICAL ANTI-TEMPLATE RULES:
1. ZERO generic/template language allowed
2. ALL content MUST be specific to "{topic}"
3. Control names MUST reflect actual topic variables (NEVER "factor1", "factor2", "primary factor")
4. Questions MUST test knowledge of "{topic}" specifically (NEVER generic science questions)
5. If you write ANYTHING that could apply to ANY topic, you have FAILED

═══════════════════════════════════════════════════════════════
NCERT CURRICULUM CONTENT (Grade {grade} {subject}):
{context}
═══════════════════════════════════════════════════════════════

Student Requirements:
- Grade: {grade}
- Subject: {subject}
- Topic: {topic}
- Difficulty: {difficulty}
- Simulation Type: {simulation_type}

TASK: Create a comprehensive, NCERT-aligned interactive learning experience.

EXAMPLES OF GOOD vs BAD:

❌ BAD (Generic): "Primary Factor", "factor1", "Secondary Factor"
✅ GOOD (Specific): "Light Intensity (lux)", "Focal Length (cm)", "Object Distance (cm)" for human eye

❌ BAD (Generic): "What is the primary purpose of {topic}?"
✅ GOOD (Specific): "Which part of the human eye controls the amount of light entering?" for human eye

❌ BAD (Generic): "Explore how {topic} works"
✅ GOOD (Specific): "Explore how the human eye's lens changes shape (accommodation) to focus on near and far objects"

STRICT REQUIREMENTS:
1. Use ONLY facts, concepts, and terminology from the NCERT context above
2. Extract actual definitions, processes, and explanations from the text
3. Reference specific NCERT concepts in key_concepts and learning_objectives
4. Base quiz questions on factual content from NCERT
5. Design simulation controls around variables mentioned in NCERT

OUTPUT RULES:
- Output ONLY valid JSON
- No markdown, no code blocks, no extra text
- Start with {{ and end with }}
- All fields are REQUIRED

JSON Structure:
{{
  "title": "[Topic name from NCERT, e.g., 'Photosynthesis: The Engine of Life']",
  "subject": "{subject}",
  "gradeLevel": {grade},
  "greeting": "Hi! I'm your AI learning coach. Today we'll explore [topic] based on your NCERT curriculum...",
  
  "scenarioDescription": "Explore how [brief description from NCERT context - what students will learn and do]",
  
  "keyConcepts": [
    {{
      "stepNumber": 1,
      "description": "Step 1: [SPECIFIC concept from NCERT - use exact terminology]",
      "details": "[3-4 sentences with DETAILED explanation from NCERT. Include specific terms, processes, parts, or mechanisms. For human eye: parts like cornea, iris, lens, retina. For photosynthesis: chlorophyll, stomata, light reactions.]"
    }},
    {{
      "stepNumber": 2,
      "description": "Step 2: [NEXT specific concept - build progressively]",
      "details": "[3-4 sentences explaining HOW this works. For human eye: how accommodation works. For photosynthesis: how light energy converts to chemical energy.]"
    }},
    {{
      "stepNumber": 3,
      "description": "Step 3: [THIRD specific concept - go deeper]",
      "details": "[3-4 sentences with specific details. For human eye: common defects and corrections. For photosynthesis: factors affecting rate.]"
    }},
    {{
      "stepNumber": 4,
      "description": "Step 4: [Fourth concept - applications/importance]",
      "details": "[3-4 sentences about real-world importance or applications from NCERT]"
    }}
    ... (4-6 key concepts total - NEVER generic, ALWAYS specific to {topic})
  ],
  
  "learningObjectives": [
    {{
      "stepNumber": 1,
      "description": "Step 1: [SPECIFIC action with TOPIC-SPECIFIC variables]",
      "details": "Students will [verb] [SPECIFIC topic elements] to observe [SPECIFIC outcomes]. Example for human eye: 'adjust object distance and focal length to observe image formation'. Example for photosynthesis: 'manipulate light intensity and CO₂ concentration to observe oxygen production rate'."
    }},
    {{
      "stepNumber": 2,
      "description": "Step 2: [SPECIFIC experimental objective]",
      "details": "Students will investigate [SPECIFIC relationship from NCERT]. Example: 'how iris diameter affects light entry' or 'how chlorophyll concentration affects glucose production'."
    }},
    {{
      "stepNumber": 3,
      "description": "Step 3: [SPECIFIC analysis objective]",
      "details": "Students will analyze [SPECIFIC data/patterns]. Example: 'calculate power of lens needed for myopia correction' or 'determine optimal conditions for maximum photosynthetic rate'."
    }},
    {{
      "stepNumber": 4,
      "description": "Step 4: [SPECIFIC application/conclusion]",
      "details": "Students will apply knowledge to [SPECIFIC real-world scenario from NCERT]."
    }}
    ... (4-6 objectives - each must name ACTUAL topic elements, NEVER generic variables)
  ],
  
  "tasks": [
    {{
      "id": 1,
      "instruction": "First, familiarize yourself with the controls. Adjust the [specific control] slider and observe what happens.",
      "checkQuestion": "What changes do you notice when you increase [variable]?",
      "hint": "Look at the [output] indicator. Try setting [control] to maximum and minimum values.",
      "encouragement": "Great exploration! You're learning how [NCERT concept] works!",
      "expectedAction": "explore_controls"
    }},
    {{
      "id": 2,
      "instruction": "Now run your first experiment. Set [control1] to [value] and [control2] to [value], then observe the results.",
      "checkQuestion": "What happened to [output]? Why do you think this occurred?",
      "hint": "According to NCERT, [concept] requires [conditions]. Check if those are met.",
      "encouragement": "Excellent! You're thinking like a scientist!",
      "expectedAction": "run_experiment_1"
    }},
    {{
      "id": 3,
      "instruction": "Test extreme conditions. Try minimum values for all controls.",
      "checkQuestion": "What limits [process]? What's the minimum requirement?",
      "hint": "NCERT mentions that [concept] cannot occur without [essential element].",
      "encouragement": "Perfect! You've discovered a key limitation!",
      "expectedAction": "test_extremes"
    }},
    {{
      "id": 4,
      "instruction": "Find the optimal balance. Adjust all controls to achieve maximum [output].",
      "checkQuestion": "What combination gave the best results?",
      "hint": "Consider the relationship between [variable1] and [variable2] mentioned in NCERT.",
      "encouragement": "Amazing work! You've optimized the conditions!",
      "expectedAction": "find_optimal"
    }},
    {{
      "id": 5,
      "instruction": "Understand cause and effect. Change ONLY [one control] while keeping others constant.",
      "checkQuestion": "How does this single variable impact [output]?",
      "hint": "This isolates the effect of [variable] on [outcome], a key scientific method.",
      "encouragement": "Brilliant! You're using controlled experiments!",
      "expectedAction": "controlled_experiment"
    }}
    ... (5-7 progressive tasks total)
  ],
  
  "simulationConfig": {{
    "type": "{simulation_type}",
    "title": "[Descriptive title - MUST include topic name]",
    "description": "[2-3 sentences explaining WHAT SPECIFICALLY this simulation shows about {topic}. For human eye: 'Demonstrates how the eye lens adjusts focal length to form clear images on retina'. For photosynthesis: 'Shows how chloroplasts convert light energy into glucose']",
    "controls": [
      {{
        "name": "[ACTUAL_VARIABLE_NAME_from_topic]",
        "label": "[Scientific Term from NCERT]",
        "controlType": "slider",  // Use "slider" for numeric controls, "dropdown" for categorical selections
        "min": [realistic minimum - ONLY for numeric/slider controls],
        "max": [realistic maximum - ONLY for numeric/slider controls],
        "default": [typical value - number for slider, string for dropdown],
        "unit": "[correct unit - cm, lux, %, ppm, etc. - ONLY for numeric controls]",
        "step": [appropriate increment - ONLY for numeric controls],
        "options": ["option1", "option2", ...],  // ONLY for dropdown controls - omit for sliders
        "description": "[2-3 sentences explaining WHAT this represents in {topic}. Example for human eye 'object_distance': 'Distance of the object from the eye lens. When varied, this demonstrates accommodation - the lens adjusts to maintain clear focus.' Example for photosynthesis 'light_intensity': 'Amount of light energy available for chlorophyll to absorb. Directly affects the rate of light-dependent reactions.']",
        "effect": "[SPECIFIC effect on topic. Example: 'Changing object distance causes ciliary muscles to adjust lens curvature' or 'Increasing light intensity boosts electron excitation in chlorophyll']"
      }}
      
      CONTROL TYPE RULES:
      - Use "slider" (with min/max/unit/step) for: temperature, light intensity, concentration, distance, mass, volume, time, etc.
      - Use "dropdown" (with options array, string default, NO min/max/unit/step) for: reactant selection, type of lens, organism type, etc.
      
      EXAMPLES OF GOOD CONTROLS:
      
      For HUMAN EYE (all sliders):
      - "object_distance" (Label: "Object Distance (cm)", min: 25, max: 600, default: 100, unit: "cm")
      - "lens_power" (Label: "Lens Power (diopters)", min: -10, max: 10, default: 0, unit: "D")
      - "light_intensity" (Label: "Ambient Light (lux)", min: 0, max: 10000, default: 500, unit: "lux")
      
      For PHOTOSYNTHESIS (all sliders):
      - "light_intensity" (Label: "Light Intensity (klux)", min: 0, max: 100, default: 30, unit: "klux")
      - "co2_concentration" (Label: "CO₂ Concentration (ppm)", min: 0, max: 1000, default: 400, unit: "ppm")
      - "temperature" (Label: "Temperature (°C)", min: 0, max: 50, default: 25, unit: "°C")
      
      For CHEMICAL REACTIONS (mix of dropdown and slider):
      - {{"name": "reactant_a", "label": "First Reactant", "controlType": "dropdown", "default": "Calcium Oxide (CaO)", "options": ["Calcium Oxide (CaO)", "Magnesium Oxide (MgO)", "Sodium Oxide (Na₂O)"], "description": "Select the metal oxide for combination reaction"}}
      - {{"name": "reactant_b", "label": "Second Reactant", "controlType": "dropdown", "default": "Water (H₂O)", "options": ["Water (H₂O)", "Oxygen (O₂)", "Hydrogen (H₂)"], "description": "Select the second reactant"}}
      - {{"name": "temperature", "label": "Temperature (°C)", "controlType": "slider", "min": 0, "max": 500, "default": 25, "unit": "°C", "step": 5, "description": "Reaction temperature"}}
      
      ❌ NEVER USE: "factor1", "factor2", "primary factor", "secondary factor", "input1", "variable_x"
      ✅ ALWAYS USE: Actual scientific terms from the topic
      ✅ SET controlType CORRECTLY: "slider" for numbers, "dropdown" for selections
      
      ... (3-6 controls based on ACTUAL variables in {topic})
    ],
    "outputs": ["[specific_output1_from_topic]", "[specific_output2]", "[specific_measurement]"],
    "visualElements": ["[specific_visual1_from_topic]", "[specific_visual2]", ...],
    "instructions": "[3-4 sentences with SPECIFIC instructions for THIS topic's simulation. Tell students WHAT to look for that's unique to {topic}]",
    "controlGuide": "[2-3 sentences explaining the BEST WAY to explore THIS specific topic. Example for human eye: 'Start by setting object distance to 25cm (near point) and observe lens curvature. Then increase distance to infinity and note how lens flattens.' Example for photosynthesis: 'Begin with medium light intensity and CO₂ at 400ppm (atmospheric level). Gradually increase light while monitoring oxygen bubble production rate.']"
  }},
  
  "interactionTypes": [
    "Run experiments",
    "Make choices",
    "Observe outcomes",
    "Answer questions"
  ],
  
  "progressSteps": [
    {{
      "stepNumber": 1,
      "title": "Explore the Controls",
      "description": "Familiarize yourself with all available controls and their effects",
      "isCompleted": false
    }},
    {{
      "stepNumber": 2,
      "title": "Run Your First Experiment",
      "description": "Adjust the parameters and observe what happens",
      "isCompleted": false
    }},
    {{
      "stepNumber": 3,
      "title": "Test Extremes",
      "description": "Try minimum and maximum values to understand limits",
      "isCompleted": false
    }},
    {{
      "stepNumber": 4,
      "title": "Find Optimal Conditions",
      "description": "Achieve the best possible output by balancing all factors",
      "isCompleted": false
    }},
    {{
      "stepNumber": 5,
      "title": "Understand Cause and Effect",
      "description": "Observe how changing one factor impacts the outputs",
      "isCompleted": false
    }}
  ],
  
  "quiz": [
    {{
      "question": "[SPECIFIC question about {topic} - MUST test actual knowledge, NOT generic science]",
      "options": [
        "A) [Wrong but topic-specific option]",
        "B) [Correct answer with specific terms from {topic}]",
        "C) [Wrong but plausible for this topic]",
        "D) [Wrong but plausible for this topic]"
      ],
      "correctAnswer": "B",
      "explanation": "[3-4 sentences explaining WHY this is correct, using SPECIFIC facts from NCERT about {topic}]"
    }},
    
    EXAMPLES OF GOOD QUIZ QUESTIONS:
    
    For HUMAN EYE:
    - "Which part of the eye contains light-sensitive cells (rods and cones)?" (Tests anatomy)
    - "A person can see distant objects clearly but has difficulty reading. What condition is this?" (Tests defects)
    - "What happens to the ciliary muscles when the eye focuses on a nearby object?" (Tests accommodation)
    - "If you adjust object distance from 25cm to 5m in the simulation, what change occurs in lens curvature?" (Tests experiment understanding)
    - "Power of a lens is -2.5D. What type of defect does this correct?" (Tests calculations)
    
    For PHOTOSYNTHESIS:
    - "Which gas is absorbed through stomata during photosynthesis?" (Tests process)
    - "In the simulation, when light intensity increased from 5 to 50 klux, what happened to oxygen production?" (Tests experiment)
    - "What is the role of chlorophyll in light reactions?" (Tests mechanism)
    - "Which factor becomes limiting when light and water are abundant but CO₂ is 100ppm?" (Tests limiting factors)
    - "Where do the dark reactions (Calvin cycle) occur in the chloroplast?" (Tests structure)
    
    ❌ NEVER ASK: "What is the primary purpose of {topic}?" or "What happens when you increase the primary factor?"
    ✅ ALWAYS ASK: Topic-specific questions using actual terms, parts, processes
    
    Generate 5-7 questions covering:
    1-2 questions: Topic structure/parts/components
    2-3 questions: How the process works / mechanisms
    1-2 questions: Experimental observations from simulation
    1 question: Applications / calculations / defects
  ],
  
  "notes": "[COMPREHENSIVE SUMMARY - 200-300 words minimum]
  
  Write a detailed summary including:
  • Definition and importance of {topic}
  • Key components/parts with their functions
  • Step-by-step process/mechanism
  • Factors affecting it
  • Common issues/defects/variations (if applicable)
  • Real-world applications from NCERT
  • Important facts students must remember
  
  Example for HUMAN EYE:
  'The human eye is a spherical sensory organ that enables vision by forming images on the retina. Key components: Cornea (transparent outer layer, maximum refraction), Iris (colored diaphragm controlling light entry via pupil), Lens (adjustable for focusing - accommodation), Retina (light-sensitive layer with rods for dim light and cones for color vision), Optic nerve (transmits signals to brain).
  
  Process: Light enters through cornea → Refracted and focused by lens → Forms inverted real image on retina → Photoreceptors convert light to electrical signals → Brain interprets image. Accommodation allows focusing from 25cm (near point) to infinity (far point) by ciliary muscles adjusting lens curvature.
  
  Common defects: Myopia (nearsightedness, corrected with concave lens), Hypermetropia (farsightedness, corrected with convex lens), Presbyopia (age-related loss of accommodation).
  
  Power of lens P = 1/f (in meters), measured in diopters (D).'
  
  For PHOTOSYNTHESIS:
  'Photosynthesis is the process by which green plants convert light energy into chemical energy (glucose). Occurs in chloroplasts containing chlorophyll. Two stages: Light reactions (thylakoid membranes) - light energy splits water, releases O₂, produces ATP and NADPH. Dark reactions/Calvin cycle (stroma) - CO₂ fixation using ATP and NADPH to synthesize glucose.
  
  Overall equation: 6CO₂ + 6H₂O + Light energy → C₆H₁₂O₆ + 6O₂
  
  Limiting factors: Light intensity, CO₂ concentration, temperature, water availability, chlorophyll amount. Increasing a limiting factor boosts rate until another factor becomes limiting.
  
  Importance: Produces food for all living organisms, releases oxygen, maintains atmospheric balance, basis of all food chains.'
  
  ",
  
  "formulas": [
    "[ALL relevant equations/formulas for {topic}]",
    
    For HUMAN EYE:
    "Power of lens: P = 1/f (where f is focal length in meters, P in diopters)",
    "Lens formula: 1/f = 1/v - 1/u (where v=image distance, u=object distance)",
    "Magnification: m = v/u = h'/h",
    "For defects: Power needed = 1/far point (myopia) or 1/near point - 1/0.25 (hypermetropia)",
    
    For PHOTOSYNTHESIS:
    "6CO₂ + 6H₂O + Light energy → C₆H₁₂O₆ + 6O₂",
    "Rate of photosynthesis ∝ Light intensity (until saturation)",
    "Optimum temperature: 25-35°C for most plants",
    
    For OTHER TOPICS: Include ANY equations mentioned in NCERT, even if not mathematical formulas
    
    ❌ NEVER leave empty if there are related equations
    ✅ ALWAYS include formulas, equations, chemical equations, or important relationships
  ],
  
  "estimatedDuration": "15-20 minutes",
  "difficultyLevel": "{difficulty}",
  
  "ncertChapter": "[Chapter name/number from NCERT if identifiable]",
  "ncertPageRefs": ["Page X", "Section Y"]
}}

CRITICAL SUCCESS FACTORS:
✓ ALL content must come from NCERT context provided
✓ Use exact terminology from NCERT (e.g., "chlorophyll", "stomata", "cornea", "retina")
✓ Quiz questions test NCERT facts about {topic}, not general science
✓ Simulation controls = ACTUAL variables from {topic} (NEVER "factor1", "factor2")
✓ Key concepts = detailed step-by-step NCERT explanation with SPECIFIC terms
✓ Learning objectives = what students DO with ACTUAL topic elements (name them!)
✓ Notes = comprehensive 200-300 word summary covering all key points
✓ Formulas = ALL relevant equations (chemical, mathematical, relationships)
✓ Use camelCase for all field names (gradeLevel, keyConcepts, stepNumber, etc.)

⚠️ REJECTION CRITERIA (if ANY of these appear, you FAILED):
❌ Generic control names like "factor1", "primary factor", "input1"
❌ Generic questions like "What is the primary purpose of..."
❌ Short notes under 150 words
❌ Empty formulas array when equations exist
❌ Generic task instructions that could apply to any topic
❌ Vague concepts like "Explore how X works" without specific mechanisms"""

CONVERSATION_GUIDE_PROMPT = """You are a friendly, encouraging AI learning coach speaking to a Grade {grade} student.

Current Context:
- Task #{task_id}: {task_instruction}
- Expected action: {expected_action}
- Student just said/did: "{student_input}"

Your role:
1. Recognize if student completed the task correctly
2. Provide gentle hints if struggling
3. Encourage and celebrate progress
4. Keep responses conversational (2-3 sentences max)
5. Speak as if talking, not writing

Response guidelines:
- If student completed task → Celebrate! Say "Great job!" or "Excellent!"
- If student needs help → Give ONE specific hint
- If student is confused → Ask a clarifying question
- If student is off-topic → Gently redirect to the task

Do NOT:
- Output JSON
- Be too technical
- Give multiple hints at once
- Skip ahead

Respond naturally as a voice coach would speak."""

QUIZ_GENERATOR_PROMPT = """Generate {count} multiple-choice questions about {topic} for Grade {grade} {subject}.

NCERT Context:
{context}

Requirements:
1. Base questions STRICTLY on NCERT curriculum
2. Appropriate difficulty for Grade {grade}
3. Each question has 4 options (A, B, C, D)
4. Include detailed explanations
5. Cover different concepts, not just definitions

Output ONLY valid JSON (no markdown):
{{
  "questions": [
    {{
      "question": "Clear, grade-appropriate question text?",
      "options": [
        "A) First option",
        "B) Second option",
        "C) Third option",
        "D) Fourth option"
      ],
      "correctAnswer": "B",
      "explanation": "Detailed explanation referencing NCERT content (2-3 sentences)"
    }}
    ... ({count} total questions)
  ]
}}"""

ASSESSMENT_PROMPT = """You are an educational assessment expert.

Student answered these questions:
{quiz_data}

Student answers:
{student_answers}

Analyze the student's performance and provide:
1. Overall mastery score (0-100)
2. Strengths (concepts understood well)
3. Areas for improvement
4. Specific recommendations for next steps

Output JSON:
{{
  "mastery_score": 75,
  "strengths": ["Understanding of basic photosynthesis", "Good grasp of inputs/outputs"],
  "areas_to_improve": ["Light reaction vs dark reaction", "Role of chlorophyll"],
  "recommendations": [
    "Review the two stages of photosynthesis",
    "Practice with chlorophyll absorption spectrum simulation"
  ],
  "next_topics": ["Cellular respiration", "Energy flow in ecosystems"]
}}"""

def get_scenario_prompt(grade: int, subject: str, topic: str, context: str, 
                       difficulty: str = "medium", simulation_type: str = "photosynthesis") -> str:
    """Get formatted scenario generation prompt."""
    return SCENARIO_GENERATOR_PROMPT.format(
        grade=grade,
        subject=subject,
        topic=topic,
        context=context,
        difficulty=difficulty,
        simulation_type=simulation_type
    )

def get_conversation_prompt(grade: int, task_id: int, task_instruction: str, 
                           expected_action: str, student_input: str) -> str:
    """Get formatted conversation guide prompt."""
    return CONVERSATION_GUIDE_PROMPT.format(
        grade=grade,
        task_id=task_id,
        task_instruction=task_instruction,
        expected_action=expected_action,
        student_input=student_input
    )

def get_quiz_prompt(topic: str, grade: int, subject: str, count: int, context: str) -> str:
    """Get formatted quiz generation prompt."""
    return QUIZ_GENERATOR_PROMPT.format(
        topic=topic,
        grade=grade,
        subject=subject,
        count=count,
        context=context
    )
