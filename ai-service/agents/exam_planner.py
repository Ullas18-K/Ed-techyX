"""
AI-Powered Exam Planner Agent
Generates dynamic, personalized study plans using RAG + Gemini
"""

import logging
import json
import google.generativeai as genai
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from config.settings import settings
from rag.retriever import RAGRetriever

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

# NCERT Chapter Priority Database (fallback + reference)
NCERT_PRIORITY_DATA = {
    "Physics": {
        11: {
            "Ray Optics and Optical Instruments": {"weightage": 14, "derivations": 5, "formulas": 12, "pyqFrequency": "high"},
            "Wave Optics": {"weightage": 10, "derivations": 4, "formulas": 8, "pyqFrequency": "high"},
            "Thermodynamics": {"weightage": 12, "derivations": 6, "formulas": 15, "pyqFrequency": "very-high"},
            "Kinetic Theory": {"weightage": 8, "derivations": 3, "formulas": 10, "pyqFrequency": "medium"},
            "Oscillations and Waves": {"weightage": 10, "derivations": 4, "formulas": 12, "pyqFrequency": "high"}
        },
        12: {
            "Electromagnetic Induction": {"weightage": 12, "derivations": 5, "formulas": 10, "pyqFrequency": "very-high"},
            "Alternating Current": {"weightage": 10, "derivations": 4, "formulas": 15, "pyqFrequency": "high"},
            "Electromagnetic Waves": {"weightage": 6, "derivations": 2, "formulas": 8, "pyqFrequency": "medium"},
            "Ray Optics": {"weightage": 14, "derivations": 6, "formulas": 12, "pyqFrequency": "very-high"},
            "Wave Optics": {"weightage": 10, "derivations": 5, "formulas": 10, "pyqFrequency": "high"}
        }
    },
    "Chemistry": {
        11: {
            "Chemical Bonding": {"weightage": 12, "derivations": 2, "formulas": 8, "pyqFrequency": "high"},
            "Thermodynamics": {"weightage": 10, "derivations": 4, "formulas": 12, "pyqFrequency": "very-high"},
            "Equilibrium": {"weightage": 12, "derivations": 3, "formulas": 10, "pyqFrequency": "high"},
            "Redox Reactions": {"weightage": 8, "derivations": 1, "formulas": 6, "pyqFrequency": "medium"}
        },
        12: {
            "Electrochemistry": {"weightage": 14, "derivations": 4, "formulas": 15, "pyqFrequency": "very-high"},
            "Chemical Kinetics": {"weightage": 12, "derivations": 3, "formulas": 12, "pyqFrequency": "high"},
            "Coordination Compounds": {"weightage": 10, "derivations": 1, "formulas": 8, "pyqFrequency": "high"},
            "Polymers": {"weightage": 6, "derivations": 0, "formulas": 4, "pyqFrequency": "medium"}
        }
    },
    "Mathematics": {
        11: {
            "Trigonometry": {"weightage": 14, "derivations": 8, "formulas": 20, "pyqFrequency": "very-high"},
            "Calculus - Limits": {"weightage": 10, "derivations": 6, "formulas": 15, "pyqFrequency": "high"},
            "Calculus - Derivatives": {"weightage": 12, "derivations": 10, "formulas": 18, "pyqFrequency": "very-high"},
            "Probability": {"weightage": 8, "derivations": 2, "formulas": 10, "pyqFrequency": "medium"}
        },
        12: {
            "Calculus - Integration": {"weightage": 16, "derivations": 12, "formulas": 25, "pyqFrequency": "very-high"},
            "Differential Equations": {"weightage": 12, "derivations": 8, "formulas": 15, "pyqFrequency": "high"},
            "Vectors": {"weightage": 10, "derivations": 6, "formulas": 12, "pyqFrequency": "high"},
            "Probability": {"weightage": 10, "derivations": 4, "formulas": 10, "pyqFrequency": "high"},
            "Linear Programming": {"weightage": 8, "derivations": 2, "formulas": 6, "pyqFrequency": "medium"}
        }
    }
}


class ExamPlannerAgent:
    """Generate personalized exam study plans using RAG + Gemini."""
    
    def __init__(self, rag_retriever):
        """Initialize the agent with RAG retriever."""
        self.rag_retriever = rag_retriever
        self.model = genai.GenerativeModel(settings.GENERATION_MODEL)
        logger.info("✅ ExamPlannerAgent initialized")
    
    def analyze_time_allocation(self, exam_date: str, current_date: str) -> Dict[str, Any]:
        """Calculate total days and allocate revision buffer."""
        exam = datetime.fromisoformat(exam_date.split('T')[0])
        today = datetime.fromisoformat(current_date.split('T')[0])
        
        diff_days = (exam - today).days
        
        if diff_days < 0:
            raise ValueError("Exam date must be in the future")
        
        # Allocate revision days based on total time
        if diff_days >= 60:
            revision_days = int(diff_days * 0.25)  # 25%
        elif diff_days >= 30:
            revision_days = int(diff_days * 0.20)  # 20%
        elif diff_days >= 14:
            revision_days = int(diff_days * 0.15)  # 15%
        elif diff_days >= 7:
            revision_days = int(diff_days * 0.10)  # 10%
        else:
            revision_days = 1
        
        study_days = diff_days - revision_days
        
        intensity = "high" if diff_days < 14 else "medium" if diff_days < 30 else "low"
        
        return {
            "totalDays": diff_days,
            "studyDays": study_days,
            "revisionDays": revision_days,
            "intensity": intensity
        }
    
    def prioritize_chapters(self, subjects: List[str], topics: List[str], grade: int = 12) -> List[Dict[str, Any]]:
        """Prioritize chapters based on NCERT relevance and exam patterns."""
        priorities = []
        
        for subject in subjects:
            subject_data = NCERT_PRIORITY_DATA.get(subject, {})
            grade_data = subject_data.get(grade, subject_data.get(12, {}))
            
            # Get relevant chapters based on topics
            relevant_chapters = []
            for topic in topics:
                for chapter_name in grade_data.keys():
                    if (topic.lower() in chapter_name.lower() or 
                        chapter_name.lower() in topic.lower() or
                        subject.lower() in topic.lower()):
                        if chapter_name not in relevant_chapters:
                            relevant_chapters.append(chapter_name)
            
            # If no match, use all chapters for that subject
            if not relevant_chapters:
                relevant_chapters = list(grade_data.keys())
            
            for chapter in relevant_chapters:
                chapter_info = grade_data.get(chapter, {
                    "weightage": 8,
                    "derivations": 2,
                    "formulas": 8,
                    "pyqFrequency": "medium"
                })
                
                # Calculate importance
                importance = "medium"
                if chapter_info["weightage"] >= 12 and chapter_info["pyqFrequency"] == "very-high":
                    importance = "critical"
                elif chapter_info["weightage"] >= 10 or chapter_info["pyqFrequency"] == "high":
                    importance = "high"
                elif chapter_info["weightage"] < 8:
                    importance = "low"
                
                priorities.append({
                    "subject": subject,
                    "chapter": chapter,
                    "importance": importance,
                    "ncertRelevance": min(10, int(chapter_info["weightage"] * 0.7)),
                    "derivationHeavy": chapter_info["derivations"] >= 4,
                    "formulaIntensive": chapter_info["formulas"] >= 10,
                    "pyqDominant": chapter_info["pyqFrequency"] in ["very-high", "high"],
                    "estimatedTime": int(chapter_info["weightage"] * 0.5),
                    "weightage": chapter_info["weightage"]
                })
        
        # Sort by importance and weightage
        importance_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        priorities.sort(key=lambda x: (importance_order[x["importance"]], x["weightage"]), reverse=True)
        
        return priorities
    
    async def generate_daily_plans(
        self,
        time_analysis: Dict[str, Any],
        chapter_priorities: List[Dict[str, Any]],
        subjects: List[str],
        topics: List[str],
        daily_study_hours: int,
        grade: int,
        exam_board: str
    ) -> List[Dict[str, Any]]:
        """Generate day-wise study plans using Gemini AI."""
        
        study_days = time_analysis["studyDays"]
        
        # Create AI prompt
        prompt = f"""You are an expert Indian education consultant specializing in {exam_board} {grade}th grade exam preparation.

TASK: Create a {study_days}-day study plan optimized for maximum marks.

EXAM DETAILS:
- Days available: {study_days} study days
- Daily study hours: {daily_study_hours} hours
- Subjects: {', '.join(subjects)}
- Topics: {', '.join(topics)}
- Grade: {grade}
- Board: {exam_board}

CHAPTER PRIORITIES (sorted by importance):
{chr(10).join([f"- {cp['subject']}: {cp['chapter']} ({cp['importance']}, {cp['weightage']} marks, {cp['estimatedTime']}h)" for cp in chapter_priorities[:15]])}

REQUIREMENTS:
1. Allocate chapters across {study_days} days
2. High-priority/critical chapters MUST get more time
3. Balance cognitive load - don't overload any single day
4. Include mixed subjects each day for variety
5. Schedule difficult topics in morning slots
6. Each day should have clear learning objectives
7. Ensure all important chapters are covered

For each day (Day 1 to Day {study_days}), provide:
- Subjects and chapters to cover
- Time slot allocation (morning/afternoon/evening/night)
- Estimated time per topic in minutes
- Rationale for scheduling
- 3-5 core concepts
- 3-5 learning objectives
- 3-5 important subtopics

Return ONLY a valid JSON array:
[
  {{
    "day": 1,
    "subjects": [
      {{
        "name": "Physics",
        "chapters": ["Ray Optics"],
        "timeSlot": "morning",
        "estimatedTime": 180
      }}
    ],
    "rationale": "Starting with high-weightage optics in fresh morning hours",
    "coreConcepts": ["Reflection", "Refraction", "Lens formula"],
    "learningObjectives": ["Understand ray diagrams", "Master lens formula"],
    "importantSubtopics": ["Mirror formula", "Magnification", "Power of lens"]
  }}
]

Generate the complete {study_days}-day plan now. Return ONLY the JSON array, no markdown or explanations."""

        try:
            logger.info(f"🔮 Generating {study_days}-day plan with Gemini...")
            
            # Generate with Gemini
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=8000,
                )
            )
            
            ai_response = response.text.strip()
            
            # Clean JSON from markdown
            ai_response = ai_response.replace("```json", "").replace("```", "").strip()
            
            # Parse JSON
            ai_plans = json.loads(ai_response)
            
            # Process and add dates
            daily_plans = []
            start_date = datetime.now()
            
            for idx, plan in enumerate(ai_plans):
                day_date = start_date + timedelta(days=idx)
                
                daily_plans.append({
                    "day": plan.get("day", idx + 1),
                    "date": day_date.strftime("%Y-%m-%d"),
                    "subjects": plan.get("subjects", []),
                    "rationale": plan.get("rationale", "Optimized for exam preparation"),
                    "preview": {
                        "coreConcepts": plan.get("coreConcepts", []),
                        "learningObjectives": plan.get("learningObjectives", []),
                        "importantSubtopics": plan.get("importantSubtopics", [])
                    }
                })
            
            logger.info(f"✅ Generated {len(daily_plans)} daily plans")
            return daily_plans
            
        except Exception as e:
            logger.error(f"❌ Gemini plan generation failed: {str(e)}")
            
            # Fallback: Create basic plan
            return self._create_fallback_plan(study_days, chapter_priorities, daily_study_hours)
    
    def _create_fallback_plan(self, study_days: int, chapter_priorities: List[Dict], daily_study_hours: int) -> List[Dict]:
        """Create a basic fallback plan when AI fails."""
        daily_plans = []
        chapters_per_day = max(1, len(chapter_priorities) // study_days)
        start_date = datetime.now()
        
        for day in range(1, study_days + 1):
            day_date = start_date + timedelta(days=day - 1)
            start_idx = (day - 1) * chapters_per_day
            day_chapters = chapter_priorities[start_idx:start_idx + chapters_per_day]
            
            subjects = []
            for ch in day_chapters:
                subjects.append({
                    "name": ch["subject"],
                    "chapters": [ch["chapter"]],
                    "timeSlot": ["morning", "afternoon", "evening"][day % 3],
                    "estimatedTime": min(ch["estimatedTime"] * 60, daily_study_hours * 60)
                })
            
            daily_plans.append({
                "day": day,
                "date": day_date.strftime("%Y-%m-%d"),
                "subjects": subjects,
                "rationale": f"Day {day}: Covering {', '.join([c['chapter'] for c in day_chapters])}",
                "preview": {
                    "coreConcepts": ["Study NCERT thoroughly", "Practice examples", "Solve exercises"],
                    "learningObjectives": ["Understand core concepts", "Master formulas", "Practice problems"],
                    "importantSubtopics": [c["chapter"] for c in day_chapters]
                }
            })
        
        return daily_plans
    
    async def generate_learning_kit(
        self,
        day: int,
        subjects: List[Dict[str, Any]],
        grade: int,
        exam_board: str
    ) -> Dict[str, Any]:
        """Generate comprehensive learning kit using RAG + Gemini."""
        
        chapters = []
        subject_names = []
        for subj in subjects:
            subject_names.append(subj["name"])
            chapters.extend(subj["chapters"])
        
        logger.info(f"📚 Generating learning kit for Day {day}: {', '.join(chapters)}")
        
        # Step 1: Get RAG context from NCERT PDFs
        rag_context = ""
        try:
            query = f"{exam_board} Class {grade} {', '.join(subject_names)} {', '.join(chapters)}"
            rag_results = self.rag_retriever.retrieve(query, k=settings.TOP_K_RESULTS)
            
            if rag_results:
                rag_context = "\n\n".join([
                    f"[NCERT Content {i+1}]\n{doc['text']}"
                    for i, doc in enumerate(rag_results)
                ])
                logger.info(f"✅ Retrieved {len(rag_results)} RAG documents")
            else:
                logger.warning("⚠️ No RAG results found, using AI knowledge only")
        except Exception as e:
            logger.error(f"❌ RAG retrieval failed: {str(e)}")
        
        # Step 2: Generate learning kit with Gemini
        prompt = f"""You are an expert {exam_board} educator creating study materials for Class {grade}.

CHAPTERS TO COVER (Day {day}):
{chr(10).join([f"{s['name']}: {', '.join(s['chapters'])}" for s in subjects])}

{"NCERT TEXTBOOK CONTENT:" if rag_context else ""}
{rag_context if rag_context else "Use your knowledge of NCERT textbooks."}

Create comprehensive learning materials with:

1. NCERT-BASED NOTES (concise, exam-focused, 400-600 words)
2. IMPORTANT DERIVATIONS (step-by-step, 3-5 derivations with difficulty levels)
3. FORMULA SHEET (all key formulas with applications and units)
4. PREVIOUS YEAR QUESTIONS (5-8 relevant PYQs with complete solutions)
5. HIGH-SCORING TIPS (exam strategies, 5-8 tips)
6. COMMON MISTAKES (what students often get wrong, 5-8 mistakes)

Return ONLY valid JSON:
{{
  "notes": "Detailed NCERT notes covering key concepts...",
  "derivations": [
    {{
      "title": "Lens Formula Derivation",
      "steps": ["Step 1: Consider a convex lens...", "Step 2: Apply sign convention...", "Step 3: From similar triangles..."],
      "difficulty": "medium"
    }}
  ],
  "formulas": [
    {{
      "name": "Lens Formula",
      "formula": "1/f = 1/v - 1/u",
      "application": "Finding image distance in lens problems",
      "units": "meters (m)"
    }}
  ],
  "pyqs": [
    {{
      "question": "A convex lens of focal length 20 cm forms an image...",
      "year": 2023,
      "examBoard": "{exam_board}",
      "marks": 3,
      "solution": "Given: f = 20 cm, u = -30 cm\\nUsing lens formula: 1/f = 1/v - 1/u...",
      "difficulty": "medium"
    }}
  ],
  "tips": ["Always draw neat ray diagrams", "Remember sign convention: distances measured from optical center"],
  "commonMistakes": ["Forgetting to apply sign convention", "Using wrong formula for given situation"]
}}

Generate complete learning kit now. Return ONLY JSON, no markdown."""

        try:
            logger.info("🔮 Generating learning kit with Gemini...")
            
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.6,
                    max_output_tokens=6000,
                )
            )
            
            ai_response = response.text.strip()
            ai_response = ai_response.replace("```json", "").replace("```", "").strip()
            
            learning_kit = json.loads(ai_response)
            
            logger.info(f"✅ Learning kit generated: {len(learning_kit.get('derivations', []))} derivations, {len(learning_kit.get('formulas', []))} formulas, {len(learning_kit.get('pyqs', []))} PYQs")
            
            return learning_kit
            
        except Exception as e:
            logger.error(f"❌ Learning kit generation failed: {str(e)}")
            
            # Fallback
            return {
                "notes": f"Study NCERT chapters: {', '.join(chapters)}. Focus on theory, examples, and end-of-chapter exercises. Make notes of important definitions and formulas.",
                "derivations": [],
                "formulas": [],
                "pyqs": [],
                "tips": [
                    "Read NCERT textbook thoroughly",
                    "Practice all solved examples",
                    "Solve exercise problems",
                    "Make formula sheets",
                    "Revise regularly"
                ],
                "commonMistakes": [
                    "Not reading theory carefully",
                    "Skipping difficult problems",
                    "Not practicing regularly"
                ]
            }
