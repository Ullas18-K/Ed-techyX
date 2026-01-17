import json
import logging
import os
from typing import Dict, Any
import vertexai
from vertexai.preview.generative_models import GenerativeModel
from google.cloud import aiplatform
from google.oauth2 import service_account

from config.settings import settings
from models.schemas import ScenarioRequest, ScenarioResponse
from prompts.templates import get_scenario_prompt
from rag.retriever import RAGRetriever

logger = logging.getLogger(__name__)

class ScenarioGenerator:
    """Generate complete learning scenarios using Gemini + RAG."""
    
    def __init__(self, rag_retriever: RAGRetriever):
        """
        Initialize scenario generator.
        
        Args:
            rag_retriever: RAG retriever instance
        """
        self.rag_retriever = rag_retriever
        
        # Initialize Gemini model with explicit credentials
        self.model = None
        if settings.GCP_PROJECT_ID and settings.GOOGLE_APPLICATION_CREDENTIALS:
            try:
                if os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS):
                    credentials = service_account.Credentials.from_service_account_file(
                        settings.GOOGLE_APPLICATION_CREDENTIALS
                    )
                    
                    vertexai.init(
                        project=settings.GCP_PROJECT_ID,
                        location=settings.GCP_LOCATION,
                        credentials=credentials
                    )
                    self.model = GenerativeModel(settings.GENERATION_MODEL)
                    logger.info(f"Gemini model initialized: {settings.GENERATION_MODEL}")
                else:
                    logger.error(f"Credentials file not found: {settings.GOOGLE_APPLICATION_CREDENTIALS}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")
        else:
            logger.warning("GCP_PROJECT_ID not set - scenario generation will use mock data")
    
    def _determine_simulation_type(self, topic: str, subject: str) -> str:
        """Determine best simulation type for the topic."""
        topic_lower = topic.lower()
        subject_lower = subject.lower()
        
        if "photosynthesis" in topic_lower or "plant" in topic_lower:
            return "photosynthesis"
        elif "circuit" in topic_lower or "electricity" in topic_lower or "ohm" in topic_lower:
            return "circuits"
        elif "pendulum" in topic_lower or "oscillation" in topic_lower:
            return "pendulum"
        elif "chemical" in topic_lower or "reaction" in topic_lower:
            return "chemical_reaction"
        else:
            return "photosynthesis"  # default
    
    async def generate(self, request: ScenarioRequest) -> ScenarioResponse:
        """
        Generate a complete learning scenario with rich curriculum content.
        
        Args:
            request: Scenario request with grade, subject, topic, student_id
            
        Returns:
            Complete scenario with enhanced structure
        """
        try:
            logger.info(f"Generating scenario: Grade {request.grade}, {request.subject}, {request.topic}")
            
            # 1. Retrieve relevant NCERT content using RAG
            # Query multiple aspects to get comprehensive context
            queries = [
                f"{request.topic} definition explanation",
                f"{request.topic} process steps",
                f"{request.topic} factors affecting",
                f"{request.topic} importance applications"
            ]
            
            logger.info("Retrieving NCERT content for comprehensive context...")
            all_contexts = []
            for q in queries:
                try:
                    # Don't filter by grade/subject - metadata format doesn't match
                    # (subject stored as 'ncert-textbook-for-class-10-science-chapter-10', not 'science')
                    ctx = self.rag_retriever.get_context_string(
                        query=q,
                        grade=None,
                        subject=None,
                        top_k=3
                    )
                    all_contexts.append(ctx)
                except Exception as e:
                    logger.warning(f"RAG query failed for '{q}': {e}")
            
            # Combine all contexts
            context = "\n\n".join(all_contexts) if all_contexts else "No relevant NCERT content found."
            logger.info(f"Retrieved total context: {len(context)} characters from {len(all_contexts)} queries")
            
            # If no context available, use basic context message
            if len(context) < 100:
                context = f"Topic: {request.topic}\nGrade: {request.grade}\nSubject: {request.subject}\n\nNote: Limited NCERT content available. Generate a comprehensive learning experience based on curriculum standards for this topic."
            
            # 2. Determine simulation type
            simulation_type = self._determine_simulation_type(request.topic, request.subject)
            logger.info(f"Simulation type: {simulation_type}")
            
            # 3. Build prompt
            prompt = get_scenario_prompt(
                grade=request.grade,
                subject=request.subject,
                topic=request.topic,
                context=context,
                difficulty=request.difficulty or "medium",
                simulation_type=simulation_type
            )
            
            # 4. Call Gemini
            if self.model:
                logger.info("✅ Gemini model available - calling API for scenario generation...")
                logger.info(f"📝 Prompt length: {len(prompt)} characters")
                logger.info(f"📚 Context length: {len(context)} characters")
                
                # Configure generation parameters
                generation_config = {
                    "temperature": 0.7,  # Balanced creativity
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 8192,  # Allow long responses
                }
                
                response = self.model.generate_content(
                    prompt,
                    generation_config=generation_config
                )
                response_text = response.text
                logger.info(f"🤖 Gemini response length: {len(response_text)} characters")
                
                # Clean response (remove markdown if present)
                response_text = response_text.strip()
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.startswith("```"):
                    response_text = response_text[3:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                response_text = response_text.strip()
                
                # Parse JSON
                scenario_data = json.loads(response_text)
                logger.info("✅ Successfully parsed Gemini JSON response")
                
                # Add scenario_id
                scenario_id = f"scn_{request.student_id}_{request.topic.replace(' ', '_')}"
                scenario_data["scenario_id"] = scenario_id
                
                # Validate and create response
                scenario_response = ScenarioResponse(**scenario_data)
                logger.info(f"🎉 Generated REAL scenario: {scenario_id} with {len(scenario_response.tasks)} tasks, {len(scenario_response.quiz)} quiz questions")
                return scenario_response
                
            else:
                # Mock response for testing without GCP
                logger.warning("⚠️ Gemini model NOT available - using MOCK scenario")
                logger.warning("⚠️ This means generic template data will be returned!")
                logger.warning(f"⚠️ Check: GCP_PROJECT_ID={settings.GCP_PROJECT_ID}, Credentials exist={os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS) if settings.GOOGLE_APPLICATION_CREDENTIALS else False}")
                return self._get_mock_scenario_response(request)
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini JSON response: {e}")
            logger.error(f"Response text: {response_text[:500]}...")
            # Return mock scenario as fallback
            return self._get_mock_scenario_response(request)
            
        except Exception as e:
            logger.error(f"Error generating scenario: {e}")
            logger.exception("Full traceback:")
            # Return mock scenario as fallback
            return self._get_mock_scenario_response(request)
    
    def _get_mock_scenario(self, request: ScenarioRequest) -> Dict[str, Any]:
        """Generate mock scenario for testing with enhanced structure."""
        simulation_type = self._determine_simulation_type(request.topic, request.subject)
        
        return {
            "title": f"{request.topic}: Interactive Learning Experience",
            "subject": request.subject.title(),
            "grade_level": request.grade,
            "greeting": f"Hi! I'm your AI learning coach powered by Gemini. Today we'll explore {request.topic} for Grade {request.grade}. Get ready for an interactive hands-on learning experience based on NCERT curriculum!",
            "scenario_description": f"Explore how {request.topic} works through interactive simulations, experiments, and observations. You'll manipulate variables, run experiments, and discover key concepts step by step.",
            "key_concepts": [
                {
                    "step_number": 1,
                    "description": f"Step 1: Understand the basic definition and components of {request.topic}",
                    "details": f"Learn what {request.topic} is, its key components, and why it's important in {request.subject}."
                },
                {
                    "step_number": 2,
                    "description": f"Step 2: Explore the factors that influence {request.topic}",
                    "details": f"Discover the variables and conditions that affect how {request.topic} occurs and its efficiency."
                },
                {
                    "step_number": 3,
                    "description": f"Step 3: Observe the process and outcomes of {request.topic}",
                    "details": f"See how {request.topic} progresses step by step and what products or results are generated."
                }
            ],
            "learning_objectives": [
                {
                    "step_number": 1,
                    "description": "Step 1: Manipulate variables to observe their individual and combined effects",
                    "details": "Students will adjust different parameters and carefully observe how each change impacts the system."
                },
                {
                    "step_number": 2,
                    "description": "Step 2: Conduct experiments to test hypotheses about optimal conditions",
                    "details": "Students will design and run controlled experiments to discover the best conditions for desired outcomes."
                },
                {
                    "step_number": 3,
                    "description": "Step 3: Analyze results to identify cause-and-effect relationships",
                    "details": "Students will examine experimental data to understand how variables interact and influence final results."
                }
            ],
            "tasks": [
                {
                    "id": 1,
                    "instruction": "Welcome! Let's start by exploring the controls. Take a moment to familiarize yourself with each slider and button.",
                    "checkQuestion": "Can you identify all the controls available? What do you think each one does?",
                    "hint": "Hover over each control to see what it represents. Try moving sliders gently to see their range.",
                    "encouragement": "Great exploration! Understanding your tools is the first step to discovery!",
                    "expectedAction": "explore_controls"
                },
                {
                    "id": 2,
                    "instruction": "Now let's run your first experiment with default settings. Click 'Run' and observe what happens.",
                    "checkQuestion": "What did you observe? What were the outputs?",
                    "hint": "Watch carefully for changes in the visualization. Note the output values displayed.",
                    "encouragement": "Perfect! You've run your first experiment successfully!",
                    "expectedAction": "first_experiment"
                },
                {
                    "id": 3,
                    "instruction": "Let's test extremes. Set all controls to minimum values and run the experiment.",
                    "checkQuestion": "What happened? Why do you think the results changed?",
                    "hint": "Compare these results with your first experiment. What's different about the conditions?",
                    "encouragement": "Excellent comparison! You're thinking scientifically!",
                    "expectedAction": "test_minimum"
                },
                {
                    "id": 4,
                    "instruction": "Now try maximum values for all controls. How do the results differ from minimum conditions?",
                    "checkQuestion": "Is maximum always better? What patterns do you notice?",
                    "hint": "Consider whether there might be an optimal balance rather than just maximum values.",
                    "encouragement": "Great insight! You're discovering important patterns!",
                    "expectedAction": "test_maximum"
                },
                {
                    "id": 5,
                    "instruction": "Time to find the optimal balance! Experiment with different combinations to achieve the best results.",
                    "checkQuestion": "What combination gave you the highest output? Why do you think that worked best?",
                    "hint": "Try adjusting one control at a time while keeping others constant. This helps isolate effects.",
                    "encouragement": "Amazing optimization! You're mastering the scientific method!",
                    "expectedAction": "optimize_conditions"
                }
            ],
            "simulationConfig": {
                "type": simulation_type,
                "title": f"{request.topic} Interactive Simulator",
                "description": f"Interactive simulation demonstrating {request.topic}. Adjust parameters to see real-time effects.",
                "controls": [
                    {
                        "name": "factor1",
                        "label": "Primary Factor",
                        "min": 0,
                        "max": 100,
                        "default": 50,
                        "unit": "%",
                        "step": 5,
                        "description": "The main influencing factor in this process",
                        "effect": "Higher values generally increase the rate and output"
                    },
                    {
                        "name": "factor2",
                        "label": "Secondary Factor",
                        "min": 0,
                        "max": 100,
                        "default": 50,
                        "unit": "units",
                        "step": 10,
                        "description": "Supporting factor that modulates the process",
                        "effect": "Interacts with primary factor to optimize results"
                    },
                    {
                        "name": "factor3",
                        "label": "Environmental Condition",
                        "min": 0,
                        "max": 100,
                        "default": 70,
                        "unit": "%",
                        "step": 5,
                        "description": "External condition affecting the process",
                        "effect": "Must be within optimal range for best results"
                    }
                ],
                "outputs": ["primary_output", "secondary_output", "efficiency"],
                "visualElements": ["main_process", "input_indicators", "output_indicators", "environment"],
                "instructions": "Use the controls on the left to adjust parameters. Click 'Run' to execute the simulation and observe results.",
                "control_guide": "Start by exploring each control individually. Then combine them to discover optimal conditions. Use the 'Record' feature to log your best results."
            },
            "interaction_types": [
                "Run experiments",
                "Make choices",
                "Observe outcomes",
                "Answer questions"
            ],
            "progress_steps": [
                {
                    "step_number": 1,
                    "title": "Explore the Controls",
                    "description": "Familiarize yourself with all available controls and their effects",
                    "is_completed": False
                },
                {
                    "step_number": 2,
                    "title": "Run Your First Experiment",
                    "description": "Adjust the parameters and observe what happens",
                    "is_completed": False
                },
                {
                    "step_number": 3,
                    "title": "Test Extremes",
                    "description": "Try minimum and maximum values to understand limits",
                    "is_completed": False
                },
                {
                    "step_number": 4,
                    "title": "Find Optimal Conditions",
                    "description": "Achieve the best possible output by balancing all factors",
                    "is_completed": False
                },
                {
                    "step_number": 5,
                    "title": "Understand Cause and Effect",
                    "description": "Observe how changing one factor impacts the outputs",
                    "is_completed": False
                }
            ],
            "quiz": [
                {
                    "question": f"What is the primary purpose of {request.topic}?",
                    "options": [
                        "A) To demonstrate scientific principles",
                        "B) To produce specific outputs or results",
                        "C) To consume energy",
                        "D) To test equipment"
                    ],
                    "correctAnswer": "B",
                    "explanation": f"{request.topic} is a fundamental process that produces important outputs. Option B correctly identifies this core purpose."
                },
                {
                    "question": "What happens when you increase the primary factor?",
                    "options": [
                        "A) Output always decreases",
                        "B) Nothing changes",
                        "C) Output generally increases up to an optimal point",
                        "D) The system stops working"
                    ],
                    "correctAnswer": "C",
                    "explanation": "In most biological and physical processes, increasing key factors boosts output until reaching an optimal point, after which other factors become limiting."
                },
                {
                    "question": "Why is it important to test extreme conditions?",
                    "options": [
                        "A) To break the simulation",
                        "B) To understand limits and identify optimal ranges",
                        "C) To waste time",
                        "D) To make the process faster"
                    ],
                    "correctAnswer": "B",
                    "explanation": "Testing extremes helps scientists identify the boundaries of a process and understand what conditions are necessary for optimal results."
                },
                {
                    "question": "What does 'controlled experiment' mean?",
                    "options": [
                        "A) Changing all variables at once",
                        "B) Changing one variable while keeping others constant",
                        "C) Not changing anything",
                        "D) Random changes"
                    ],
                    "correctAnswer": "B",
                    "explanation": "A controlled experiment isolates the effect of one variable by keeping all other factors constant, allowing clear cause-and-effect analysis."
                },
                {
                    "question": f"Based on your experiments, what conditions optimize {request.topic}?",
                    "options": [
                        "A) Minimum values for all factors",
                        "B) Maximum values for all factors",
                        "C) A balanced combination of factors within optimal ranges",
                        "D) Random values"
                    ],
                    "correctAnswer": "C",
                    "explanation": "Most processes require balanced conditions rather than extremes. Multiple factors must work together within optimal ranges for best results."
                }
            ],
            "notes": f"Key points about {request.topic}:\\n• Requires specific conditions to occur efficiently\\n• Multiple factors interact to influence outcomes\\n• Optimal results come from balanced conditions, not extremes\\n• Understanding cause-and-effect helps predict and control the process",
            "formulas": [],
            "estimated_duration": "15-20 minutes",
            "difficulty_level": request.difficulty or "medium",
            "ncert_chapter": f"Grade {request.grade} {request.subject.title()}",
            "ncert_page_refs": []
        }
    
    def _get_mock_scenario_response(self, request: ScenarioRequest) -> ScenarioResponse:
        """Get mock scenario as ScenarioResponse object."""
        mock_data = self._get_mock_scenario(request)
        scenario_id = f"scn_{request.student_id}_{request.topic.replace(' ', '_')}"
        mock_data["scenario_id"] = scenario_id
        
        return ScenarioResponse(**mock_data)
