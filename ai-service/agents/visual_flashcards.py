"""
Visual Flashcard Generator Agent
Generates image-based flashcards using RAG + Gemini
"""

import logging
from typing import List, Dict, Any
import google.generativeai as genai
from PIL import Image
import io
import base64

from config.settings import settings
from rag.retriever import RAGRetriever

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)


class VisualFlashcardGenerator:
    """Generates image-based flashcards using RAG context and Gemini"""
    
    def __init__(self, rag_retriever: RAGRetriever):
        self.rag = rag_retriever
        self.text_model = genai.GenerativeModel('gemini-2.0-flash-exp')
        # Using latest Gemini for better image prompt generation
        
    async def generate_flashcards(
        self,
        grade: int,
        subject: str,
        topic: str
    ) -> List[Dict[str, Any]]:
        """
        Generate 4-5 visual flashcard concepts with images
        
        Returns:
            [
                {
                    "name": "Incident Ray",
                    "image_base64": "data:image/png;base64,..."
                }
            ]
        """
        try:
            logger.info(f"\n{'='*60}")
            logger.info(f"🎨 STARTING FLASHCARD GENERATION")
            logger.info(f"   Grade: {grade}")
            logger.info(f"   Subject: {subject}")
            logger.info(f"   Topic: {topic}")
            logger.info(f"{'='*60}")
            
            # Step 1: Get NCERT context using RAG
            logger.info("\n📚 Step 1: Retrieving NCERT context via RAG...")
            rag_context = await self._get_rag_context(grade, subject, topic)
            logger.info(f"   ✅ Retrieved {len(rag_context)} characters of context")
            
            # Step 2: Use Gemini to decide flashcard concepts
            logger.info("\n💡 Step 2: Generating flashcard concepts with Gemini...")
            concepts = await self._generate_concepts(grade, subject, topic, rag_context)
            logger.info(f"   ✅ Generated {len(concepts)} concepts")
            
            # Step 3: Generate images for each concept
            logger.info(f"\n🖼️  Step 3: Generating images for {len(concepts)} concepts...")
            flashcards = []
            for i, concept in enumerate(concepts, 1):
                try:
                    logger.info(f"   🖼️  [{i}/{len(concepts)}] Generating image for: {concept['name']}")
                    image_base64 = await self._generate_image(concept, grade, subject, topic)
                    flashcards.append({
                        "name": concept["name"],
                        "image_base64": image_base64
                    })
                    logger.info(f"   ✅ [{i}/{len(concepts)}] Successfully generated: {concept['name']}")
                except Exception as e:
                    logger.error(f"   ❌ [{i}/{len(concepts)}] Failed to generate image for {concept['name']}: {e}")
                    import traceback
                    logger.error(f"   Stack trace:\n{traceback.format_exc()}")
                    # Continue with other flashcards
                    
            logger.info(f"\n{'='*60}")
            logger.info(f"🎉 GENERATION COMPLETE: {len(flashcards)}/{len(concepts)} flashcards")
            logger.info(f"   Success rate: {len(flashcards)/len(concepts)*100:.1f}%")
            logger.info(f"{'='*60}\n")
            return flashcards
            
        except Exception as e:
            logger.error(f"\n{'='*60}")
            logger.error(f"❌ FLASHCARD GENERATION FAILED")
            logger.error(f"   Error: {str(e)}")
            logger.error(f"   Type: {type(e).__name__}")
            logger.error(f"{'='*60}\n")
            import traceback
            logger.error(f"Stack trace:\n{traceback.format_exc()}")
            raise
            
    async def _get_rag_context(self, grade: int, subject: str, topic: str) -> str:
        """Retrieve relevant NCERT content"""
        try:
            query = f"{subject} {topic} class {grade}"
            results = self.rag.retrieve(
                query=query,
                filters={"grade": grade, "subject": subject.lower()},
                top_k=5
            )
            
            # Combine retrieved content
            context = "\n\n".join([doc for doc in results["documents"]])
            logger.info(f"📚 Retrieved {len(results['documents'])} NCERT chunks")
            return context
            
        except Exception as e:
            logger.warning(f"⚠️ RAG retrieval failed, proceeding without context: {e}")
            return ""
            
    async def _generate_concepts(
        self,
        grade: int,
        subject: str,
        topic: str,
        rag_context: str
    ) -> List[Dict[str, str]]:
        """Use Gemini to generate flashcard concepts based on NCERT content"""
        
        prompt = f"""You are an expert educator creating visual flashcards for Class {grade} {subject}.

Topic: {topic}

NCERT Context:
{rag_context[:2000] if rag_context else "No specific context available - use standard curriculum knowledge."}

Generate 4-5 key visual concepts that would make excellent image-based flashcards.
Each concept should be:
- A fundamental visual element students must recognize
- Suitable for a diagram or illustration
- Based on NCERT curriculum
- Something that can be drawn/illustrated clearly

For each concept, provide:
1. name: A short label (1-3 words)
2. visualDescription: What the image should show (for image generation)

Return ONLY valid JSON array format:
[
  {{
    "name": "Incident Ray",
    "visualDescription": "A straight light ray with an arrow approaching a plane mirror at an angle, labeled clearly"
  }},
  ...
]

Focus on visual concepts like: diagrams, apparatus, ray diagrams, structures, processes, phenomena.
DO NOT include: text explanations, formulas, or non-visual content.
"""

        try:
            response = self.text_model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON from markdown code blocks if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
                
            # Parse JSON
            import json
            concepts = json.loads(response_text)
            
            logger.info(f"💡 Generated {len(concepts)} flashcard concepts")
            return concepts
            
        except Exception as e:
            logger.error(f"❌ Concept generation failed: {e}")
            # Fallback to basic concepts
            return self._get_fallback_concepts(topic)
            
    def _get_fallback_concepts(self, topic: str) -> List[Dict[str, str]]:
        """Fallback concepts if Gemini fails"""
        return [
            {
                "name": f"{topic} Diagram",
                "visualDescription": f"A clear educational diagram showing {topic}"
            },
            {
                "name": f"{topic} Setup",
                "visualDescription": f"Experimental setup or apparatus for {topic}"
            },
            {
                "name": f"{topic} Process",
                "visualDescription": f"Step-by-step visual process of {topic}"
            }
        ]
        
    async def _generate_image(
        self,
        concept: Dict[str, str],
        grade: int,
        subject: str,
        topic: str
    ) -> str:
        """
        Generate educational diagram using Vertex AI Imagen
        Creates clean, colorful NCERT-style educational diagrams
        """
        
        # Create detailed, NCERT-focused prompt for Imagen
        image_prompt = f"""Create a clean educational diagram for NCERT Class {grade} {subject} textbook.

CONCEPT: {concept['name']}
VISUAL: {concept['visualDescription']}

STYLE REQUIREMENTS:
- Clean, modern educational illustration
- Use colors: blue for light/water, red for important elements, yellow for highlights
- White or light cream background
- Clear black outlines and labels
- Professional NCERT textbook quality
- Simple and uncluttered
- Well-labeled with minimal text
- Use arrows to show direction/flow
- Academic illustration style, NOT sketch or photograph

WHAT TO SHOW:
- Single focused diagram matching the concept exactly
- Clear labeling in English
- Proper proportions and accurate representation
- Scientific accuracy based on NCERT standards

AVOID:
- Too much text or explanations
- Dark or black backgrounds
- Cluttered or busy layouts
- Photorealistic or sketchy styles
- Watermarks or logos
- Multiple concepts in one image"""

        try:
            # Use Vertex AI Imagen (Google Cloud) for real image generation
            try:
                from google.cloud import aiplatform
                from vertexai.preview.vision_models import ImageGenerationModel
                
                logger.info(f"   🎨 Generating Vertex AI Imagen image for: {concept['name']}")
                
                # Initialize Vertex AI
                aiplatform.init(
                    project=settings.GCP_PROJECT_ID,
                    location=settings.GCP_LOCATION
                )
                
                # Use latest Imagen model with better quality
                model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-001")
                
                images = model.generate_images(
                    prompt=image_prompt,
                    number_of_images=1,
                    aspect_ratio="16:9",  # Better for educational diagrams
                    language="en",
                    add_watermark=False,
                )
                
                # Convert to base64
                image = images[0]
                image_bytes = image._image_bytes
                img_str = base64.b64encode(image_bytes).decode()
                
                logger.info(f"   ✅ Vertex AI Imagen generated for: {concept['name']}")
                return f"data:image/png;base64,{img_str}"
                
            except Exception as e:
                logger.warning(f"   ⚠️ Vertex AI Imagen failed ({e}), using placeholder")
                logger.warning(f"   Make sure google-cloud-aiplatform is installed: pip install google-cloud-aiplatform")
                return self._generate_placeholder_image(concept["name"])
                
        except Exception as e:
            logger.error(f"❌ Image generation failed: {e}")
            return self._generate_placeholder_image(concept["name"])
            
    def _generate_placeholder_image(self, text: str) -> str:
        """Generate a simple placeholder image with text"""
        from PIL import Image, ImageDraw, ImageFont
        
        # Create a simple diagram placeholder
        width, height = 400, 300
        img = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(img)
        
        # Draw border
        draw.rectangle([10, 10, width-10, height-10], outline='black', width=3)
        
        # Add text
        try:
            # Try to use a nice font
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()
            
        # Center text
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (width - text_width) // 2
        y = (height - text_height) // 2
        
        draw.text((x, y), text, fill='black', font=font)
        
        # Add "Educational Diagram" subtitle
        subtitle = "Educational Diagram"
        bbox2 = draw.textbbox((0, 0), subtitle, font=font)
        subtitle_width = bbox2[2] - bbox2[0]
        draw.text(((width - subtitle_width) // 2, y + 40), subtitle, fill='gray', font=font)
        
        # Convert to base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
