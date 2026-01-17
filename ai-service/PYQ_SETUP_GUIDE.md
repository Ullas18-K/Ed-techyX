# PYQ System - Setup Instructions

## 📁 Directory Structure Created

```
ai-service/
├── data/
│   └── pyqs/
│       ├── pdfs/          ← PUT YOUR PDF FILES HERE
│       └── images/        ← Auto-generated (extracted images)
├── agents/
│   └── pyq_generator.py   ← Hybrid RAG + Gemini question generator
├── utils/
│   └── pyq_ingestion.py   ← PDF processor with Gemini Vision
└── models/
    └── pyq_schemas.py     ← PYQ data models
```

---

## 🚀 Quick Start Guide

### Step 1: Add Your PYQ PDFs

Place your Previous Year Question PDFs in:
```
C:\Users\Ullas\MyDocs\Projects\edtech\EdTech\ai-service\data\pyqs\pdfs\
```

**Naming convention** (recommended):
- `science_2023_pyq.pdf`
- `physics_class10_2022.pdf`
- `chemistry_grade9_2021.pdf`

### Step 2: Install Dependencies

```powershell
cd C:\Users\Ullas\MyDocs\Projects\edtech\EdTech\ai-service
.\venv\Scripts\Activate.ps1
pip install PyPDF2 Pillow pdf2image
```

### Step 3: Ingest PDFs (One-Time Setup)

**Option A: Automatic (via startup)**
- The server will auto-ingest all PDFs in `data/pyqs/pdfs/` on startup

**Option B: Manual (via API endpoint)**
```bash
# Start server first
python main.py

# Then trigger ingestion
curl -X POST http://localhost:8001/api/questions/ingest
```

### Step 4: Test the System

**Get practice questions:**
```bash
curl -X POST http://localhost:8001/api/questions/practice \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "photosynthesis",
    "grade": 10,
    "subject": "science",
    "count": 5
  }'
```

**Expected Response:**
```json
{
  "questions": [
    {
      "questionId": "pyq_1234",
      "questionText": "Explain the process of photosynthesis...",
      "topic": "photosynthesis",
      "subject": "science",
      "grade": 10,
      "year": 2023,
      "hasImage": true,
      "imageUrl": "/api/assets/pyqs/images/science_2023_page_5_img_1.png",
      "imageDescription": "Diagram showing chloroplast structure with labeled thylakoids and stroma",
      "answer": "Photosynthesis occurs in two stages...",
      "source": "pyq",
      "sourcePdf": "science_2023_pyq.pdf"
    },
    ...
  ],
  "totalCount": 5,
  "ragCount": 3,
  "generatedCount": 2
}
```

---

## 🎯 How It Works (Hybrid Approach)

### 1. **RAG Layer** (Real PYQs from PDFs)
```
Your PDF → Extract text & images → Gemini Vision analyzes diagrams
→ Store in ChromaDB → Retrieve via semantic search
```

### 2. **Gemini Generation Layer** (Supplementary Questions)
```
If RAG returns < 5 questions → Gemini generates missing questions
→ Ensures you always get requested count
→ Generated questions validated against NCERT concepts
```

### 3. **Image Handling**
```
PDF has diagram → Extract as PNG → Gemini Vision describes it
→ Store image in data/pyqs/images/ → Return URL + description
→ Frontend displays image with question
```

---

## 📊 API Endpoints

### 1. Get Practice Questions
```
POST /api/questions/practice
```

**Request:**
```json
{
  "topic": "ray optics",
  "grade": 10,
  "subject": "science",
  "count": 5,
  "difficulty": "medium",
  "includeGenerated": true
}
```

**Response:** See example above

---

### 2. Ingest PDFs
```
POST /api/questions/ingest
```

**Response:**
```json
{
  "status": "success",
  "pdfsProcessed": 3,
  "totalQuestions": 47,
  "totalImages": 12
}
```

---

### 3. Serve Question Images
```
GET /api/assets/pyqs/images/{filename}
```

**Example:**
```
http://localhost:8001/api/assets/pyqs/images/science_2023_page_5_img_1.png
```

---

## 🔧 Configuration

### Customize in `utils/pyq_ingestion.py`:

**Image detection threshold:**
```python
def _has_significant_image(self, page) -> bool:
    # Adjust threshold (default: 10KB)
    return image_size > 10 * 1024  # bytes
```

**Question extraction pattern:**
```python
# Modify regex to match your PDF format
QUESTION_PATTERN = r'Q\.\s*\d+\.?\s*(.*?)(?=Q\.\s*\d+|$)'
```

---

## 💡 Tips for Best Results

### PDF Format Requirements:
✅ **Good:**
- Clear question numbering (Q1, Q2, etc.)
- Answers after questions or in separate section
- High-quality images (diagrams, circuits, etc.)

❌ **Avoid:**
- Scanned PDFs with poor OCR quality
- Handwritten questions
- Extremely low-resolution images

### Recommended PDF Structure:
```
Q1. What is photosynthesis?
[Optional: Diagram of chloroplast]

Answer: Photosynthesis is the process...

Q2. Calculate the focal length...
[Optional: Ray diagram]

Answer: Using lens formula 1/f = 1/v - 1/u...
```

---

## 🐛 Troubleshooting

### Issue: No questions returned
**Solution:** Check ChromaDB ingestion
```bash
# Verify documents in vector store
curl http://localhost:8001/api/health
# Check "total_documents" count
```

### Issue: Images not displaying
**Solution:** Check image extraction
```bash
# Verify images folder
ls data/pyqs/images/
# Should see .png files
```

### Issue: Generated questions quality is poor
**Solution:** Improve RAG context
- Add more PYQ PDFs (more examples = better generation)
- Ensure PDFs have answers (Gemini learns from them)

---

## 💰 Cost Estimate

### One-time ingestion (100 questions with 20 images):
- PDF processing: Free
- Gemini Vision (20 images): ~$0.10
- Vector storage: ~$0.01/month

### Per request (assuming 3 RAG + 2 generated):
- RAG retrieval: Free
- Gemini generation (2 questions): ~$0.002
- **Total: ~$2/month for 1000 requests**

---

## 🚀 Next Steps

1. ✅ Add your PYQ PDFs to `data/pyqs/pdfs/`
2. ✅ Start the server: `python main.py`
3. ✅ Test with a topic: `/api/questions/practice`
4. ✅ Integrate with frontend (see frontend example below)

---

## 📱 Frontend Integration Example

```tsx
import { useState } from 'react';

interface PYQQuestion {
  questionId: string;
  questionText: string;
  hasImage: boolean;
  imageUrl?: string;
  imageDescription?: string;
  answer?: string;
  options?: string[];
  year?: number;
  source: 'pyq' | 'generated';
}

export function PYQPanel({ topic, grade }: { topic: string; grade: number }) {
  const [questions, setQuestions] = useState<PYQQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    const response = await fetch('http://localhost:8001/api/questions/practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        grade,
        subject: 'science',
        count: 5,
        includeGenerated: true
      })
    });
    
    const data = await response.json();
    setQuestions(data.questions);
    setLoading(false);
  };

  return (
    <div className="pyq-panel">
      <h2>Practice Questions: {topic}</h2>
      <button onClick={fetchQuestions} disabled={loading}>
        {loading ? 'Loading...' : 'Get Questions'}
      </button>
      
      {questions.map((q, idx) => (
        <div key={q.questionId} className="question-card">
          <div className="question-header">
            <span className="question-number">Q{idx + 1}</span>
            <span className="source-badge">{q.source === 'pyq' ? `📄 ${q.year || 'PYQ'}` : '🤖 Generated'}</span>
          </div>
          
          <p className="question-text">{q.questionText}</p>
          
          {q.hasImage && q.imageUrl && (
            <div className="question-image">
              <img 
                src={`http://localhost:8001${q.imageUrl}`} 
                alt={q.imageDescription || 'Question diagram'}
              />
              {q.imageDescription && (
                <details>
                  <summary>View diagram description</summary>
                  <p>{q.imageDescription}</p>
                </details>
              )}
            </div>
          )}
          
          {q.options && (
            <div className="options">
              {q.options.map((opt, i) => (
                <label key={i}>
                  <input type="radio" name={q.questionId} />
                  {opt}
                </label>
              ))}
            </div>
          )}
          
          <details className="answer">
            <summary>Show Answer</summary>
            <p>{q.answer}</p>
          </details>
        </div>
      ))}
    </div>
  );
}
```

---

## ✨ Features Implemented

✅ PDF ingestion with text extraction  
✅ Image extraction and storage  
✅ Gemini Vision for diagram analysis  
✅ RAG-based question retrieval  
✅ Hybrid generation (RAG + Gemini)  
✅ Answer extraction from PDFs  
✅ MCQ support with options  
✅ Image serving via API  
✅ Question caching (cost optimization)  
✅ Source tracking (PYQ vs Generated)  
✅ Year/difficulty metadata  

---

## 📞 Support

For issues or questions:
1. Check server logs: `tail -f logs/api.log`
2. Verify ChromaDB: Visit `http://localhost:8001/api/health`
3. Test endpoints: Visit `http://localhost:8001/docs`

---

**Ready to go! Just add your PDFs and start the server.** 🚀
