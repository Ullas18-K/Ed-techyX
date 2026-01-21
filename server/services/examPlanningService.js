import axios from 'axios';

const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_BASE_URL || 'http://localhost:8001';
const AI_SERVICE_URL = AI_SERVICE_BASE_URL;

/**
 * NCERT Chapter Priority Database
 * Based on exam patterns and weightage analysis
 */
const NCERT_PRIORITY_DATA = {
  Physics: {
    11: {
      'Ray Optics and Optical Instruments': { weightage: 14, derivations: 5, formulas: 12, pyqFrequency: 'high' },
      'Wave Optics': { weightage: 10, derivations: 4, formulas: 8, pyqFrequency: 'high' },
      'Thermodynamics': { weightage: 12, derivations: 6, formulas: 15, pyqFrequency: 'very-high' },
      'Kinetic Theory': { weightage: 8, derivations: 3, formulas: 10, pyqFrequency: 'medium' },
      'Oscillations and Waves': { weightage: 10, derivations: 4, formulas: 12, pyqFrequency: 'high' }
    },
    12: {
      'Electromagnetic Induction': { weightage: 12, derivations: 5, formulas: 10, pyqFrequency: 'very-high' },
      'Alternating Current': { weightage: 10, derivations: 4, formulas: 15, pyqFrequency: 'high' },
      'Electromagnetic Waves': { weightage: 6, derivations: 2, formulas: 8, pyqFrequency: 'medium' },
      'Ray Optics': { weightage: 14, derivations: 6, formulas: 12, pyqFrequency: 'very-high' },
      'Wave Optics': { weightage: 10, derivations: 5, formulas: 10, pyqFrequency: 'high' }
    }
  },
  Chemistry: {
    11: {
      'Chemical Bonding': { weightage: 12, derivations: 2, formulas: 8, pyqFrequency: 'high' },
      'Thermodynamics': { weightage: 10, derivations: 4, formulas: 12, pyqFrequency: 'very-high' },
      'Equilibrium': { weightage: 12, derivations: 3, formulas: 10, pyqFrequency: 'high' },
      'Redox Reactions': { weightage: 8, derivations: 1, formulas: 6, pyqFrequency: 'medium' }
    },
    12: {
      'Electrochemistry': { weightage: 14, derivations: 4, formulas: 15, pyqFrequency: 'very-high' },
      'Chemical Kinetics': { weightage: 12, derivations: 3, formulas: 12, pyqFrequency: 'high' },
      'Coordination Compounds': { weightage: 10, derivations: 1, formulas: 8, pyqFrequency: 'high' },
      'Polymers': { weightage: 6, derivations: 0, formulas: 4, pyqFrequency: 'medium' }
    }
  },
  Mathematics: {
    11: {
      'Trigonometry': { weightage: 14, derivations: 8, formulas: 20, pyqFrequency: 'very-high' },
      'Calculus - Limits': { weightage: 10, derivations: 6, formulas: 15, pyqFrequency: 'high' },
      'Calculus - Derivatives': { weightage: 12, derivations: 10, formulas: 18, pyqFrequency: 'very-high' },
      'Probability': { weightage: 8, derivations: 2, formulas: 10, pyqFrequency: 'medium' }
    },
    12: {
      'Calculus - Integration': { weightage: 16, derivations: 12, formulas: 25, pyqFrequency: 'very-high' },
      'Differential Equations': { weightage: 12, derivations: 8, formulas: 15, pyqFrequency: 'high' },
      'Vectors': { weightage: 10, derivations: 6, formulas: 12, pyqFrequency: 'high' },
      'Probability': { weightage: 10, derivations: 4, formulas: 10, pyqFrequency: 'high' },
      'Linear Programming': { weightage: 8, derivations: 2, formulas: 6, pyqFrequency: 'medium' }
    }
  }
};

/**
 * Calculate total days and allocate revision buffer
 */
export function analyzeTimeAllocation(examDate, currentDate) {
  const exam = new Date(examDate);
  const today = new Date(currentDate);
  
  const diffTime = exam - today;
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (totalDays < 0) {
    throw new Error('Exam date must be in the future');
  }
  
  // Allocate revision days based on total time
  let revisionDays = 0;
  let studyDays = totalDays;
  
  if (totalDays >= 60) {
    revisionDays = Math.floor(totalDays * 0.25); // 25% for revision
  } else if (totalDays >= 30) {
    revisionDays = Math.floor(totalDays * 0.20); // 20% for revision
  } else if (totalDays >= 14) {
    revisionDays = Math.floor(totalDays * 0.15); // 15% for revision
  } else if (totalDays >= 7) {
    revisionDays = Math.floor(totalDays * 0.10); // 10% for revision
  }
  
  studyDays = totalDays - revisionDays;
  
  return {
    totalDays,
    studyDays,
    revisionDays,
    daysPerWeek: Math.ceil(totalDays / 7),
    intensity: totalDays < 14 ? 'high' : totalDays < 30 ? 'medium' : 'low'
  };
}

/**
 * Prioritize chapters based on NCERT relevance and exam patterns
 */
export function prioritizeChapters(subjects, topics, grade = 12) {
  const priorities = [];
  
  subjects.forEach(subject => {
    const subjectData = NCERT_PRIORITY_DATA[subject.name];
    if (!subjectData) return;
    
    const gradeData = subjectData[grade] || subjectData[12];
    
    // Get relevant chapters based on topics
    const relevantChapters = topics
      .filter(topic => topic.toLowerCase().includes(subject.name.toLowerCase()) || 
                       Object.keys(gradeData).some(ch => topic.toLowerCase().includes(ch.toLowerCase())))
      .map(topic => {
        // Find matching chapter
        const matchingChapter = Object.keys(gradeData).find(ch => 
          topic.toLowerCase().includes(ch.toLowerCase()) || 
          ch.toLowerCase().includes(topic.toLowerCase())
        );
        return matchingChapter || topic;
      });
    
    // If no specific topics, include all chapters
    const chaptersToProcess = relevantChapters.length > 0 ? relevantChapters : Object.keys(gradeData);
    
    chaptersToProcess.forEach(chapter => {
      const chapterInfo = gradeData[chapter] || {
        weightage: 8,
        derivations: 2,
        formulas: 8,
        pyqFrequency: 'medium'
      };
      
      // Calculate importance
      let importance = 'medium';
      if (chapterInfo.weightage >= 12 && chapterInfo.pyqFrequency === 'very-high') {
        importance = 'critical';
      } else if (chapterInfo.weightage >= 10 || chapterInfo.pyqFrequency === 'high') {
        importance = 'high';
      } else if (chapterInfo.weightage < 8) {
        importance = 'low';
      }
      
      priorities.push({
        subject: subject.name,
        chapter,
        importance,
        ncertRelevance: Math.min(10, Math.round(chapterInfo.weightage * 0.7)),
        derivationHeavy: chapterInfo.derivations >= 4,
        formulaIntensive: chapterInfo.formulas >= 10,
        pyqDominant: chapterInfo.pyqFrequency === 'very-high' || chapterInfo.pyqFrequency === 'high',
        estimatedTime: Math.ceil(chapterInfo.weightage * 0.5), // hours
        weightage: chapterInfo.weightage
      });
    });
  });
  
  // Sort by importance and weightage
  const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  priorities.sort((a, b) => {
    if (importanceOrder[a.importance] !== importanceOrder[b.importance]) {
      return importanceOrder[b.importance] - importanceOrder[a.importance];
    }
    return b.weightage - a.weightage;
  });
  
  return priorities;
}

/**
 * Generate AI-powered study plan using Gemini
 */
export async function generateStudyPlan(examPlanData) {
  const { examDate, currentDate, subjects, topics, dailyStudyHours = 6, grade = 12, examBoard = 'CBSE' } = examPlanData;
  
  try {
    console.log('🔮 Calling AI service for exam plan generation...');
    
    // Call the AI service endpoint for plan structure
    const response = await axios.post(`${AI_SERVICE_URL}/api/exam-planning/generate`, {
      exam_date: examDate,
      current_date: currentDate,
      subjects: subjects,
      topics: topics,
      daily_study_hours: dailyStudyHours,
      grade: grade,
      exam_board: examBoard
    }, {
      timeout: 3000000
    });
    
    if (response.data) {
      console.log(`✅ AI service returned plan with ${response.data.chapter_priorities.length} chapters and ${response.data.daily_plans.length} days`);
      
      return {
        timeAnalysis: response.data.time_analysis,
        chapterPriorities: response.data.chapter_priorities,
        dailyPlans: response.data.daily_plans,
        metadata: response.data.metadata
      };
    }
    
    throw new Error('Invalid response from AI service');
    
  } catch (error) {
    console.error('❌ AI service plan generation failed:', error.message);
    
    // Fallback to basic plan
    console.log('⚠️ Falling back to basic plan generation...');
    
    const timeAnalysis = analyzeTimeAllocation(examDate, currentDate);
    const chapterPriorities = prioritizeChapters(
      subjects.map(s => ({ name: s })),
      topics,
      grade
    );
    
    const dailyPlans = createFallbackDailyPlans(timeAnalysis, chapterPriorities, dailyStudyHours);
    
    return {
      timeAnalysis,
      chapterPriorities,
      dailyPlans,
      metadata: {
        totalChapters: chapterPriorities.length,
        totalTopics: topics.length,
        estimatedTotalHours: timeAnalysis.studyDays * dailyStudyHours
      }
    };
  }
}

/**
 * Generate day-wise study plans with AI
 */
async function generateDailyPlans({ timeAnalysis, chapterPriorities, subjects, topics, dailyStudyHours, grade }) {
  // This function is now deprecated - using AI service endpoint instead
  // Keeping it for reference/fallback
  return createFallbackDailyPlans(timeAnalysis, chapterPriorities, dailyStudyHours);
}

/**
 * Create fallback daily plans when AI service is unavailable
 */
function createFallbackDailyPlans(timeAnalysis, chapterPriorities, dailyStudyHours) {
  const dailyPlans = [];
  const { studyDays } = timeAnalysis;
  const chaptersPerDay = Math.ceil(chapterPriorities.length / studyDays);
  const startDate = new Date();
  
  for (let day = 1; day <= studyDays; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day - 1);
    
    const startIdx = (day - 1) * chaptersPerDay;
    const dayChapters = chapterPriorities.slice(startIdx, startIdx + chaptersPerDay);
    
    const subjects = dayChapters.map(ch => ({
      name: ch.subject,
      chapters: [ch.chapter],
      timeSlot: day % 3 === 1 ? 'morning' : day % 3 === 2 ? 'afternoon' : 'evening',
      estimatedTime: Math.min(ch.estimatedTime * 60, dailyStudyHours * 60)
    }));
    
    dailyPlans.push({
      day,
      date: dayDate.toISOString().split('T')[0],
      subjects,
      rationale: `Day ${day}: Covering ${dayChapters.map(c => c.chapter).join(', ')}`,
      preview: {
        coreConcepts: ['Study NCERT thoroughly', 'Practice examples', 'Solve exercises'],
        learningObjectives: ['Understand core concepts', 'Master formulas', 'Practice problems'],
        importantSubtopics: dayChapters.map(c => c.chapter)
      },
      learningKit: {
        notes: '',
        derivations: [],
        formulas: [],
        pyqs: [],
        tips: [],
        commonMistakes: []
      }
    });
  }
  
  return dailyPlans;
}

/**
 * Build complete learning kit by aggregating scenario + practice questions
 * Uses ONLY existing AI service endpoints (no custom exam-planning endpoints)
 */
async function buildCompleteLearningKit(dayPlan, examBoard, grade) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏗️  BUILDING COMPLETE LEARNING KIT - Day ${dayPlan.day}`);
  console.log(`${'='.repeat(60)}`);
  
  const kit = {
    notes: '',
    derivations: [],
    formulas: [],
    pyqs: [],
    tips: [],
    commonMistakes: [],
    scenarios: [],
    practiceQuestions: [],
    metadata: {}
  };
  
  // Extract subjects and topics
  const subjects = dayPlan.subjects || [];
  const subjectNames = subjects.map(s => s.name);
  const allChapters = subjects.flatMap(s => s.chapters || []);
  
  console.log(`📚 Subjects: ${subjectNames.join(', ')}`);
  console.log(`📖 Chapters: ${allChapters.join(', ')}`);
  
  // ============================================================
  // Generate Scenarios + Practice Questions for Each Subject
  // (Scenario contains: notes, formulas, derivations, quiz, concepts, objectives)
  // ============================================================
  console.log(`\n[1/1] 🎬 Generating scenarios and practice questions for each subject...`);
  
  const contentPromises = subjects.map(async (subject) => {
    const topic = subject.chapters[0] || subject.name;
    
    try {
      console.log(`  🎯 Processing: ${subject.name} - ${topic}`);
      
      // Generate scenario (contains most of the learning data)
      const scenarioPromise = axios.post(`${AI_SERVICE_URL}/api/scenario/generate`, {
        subject: subject.name.toLowerCase(),
        topic: topic.toLowerCase(),
        grade: grade,
        student_id: 'exam-planner',
        difficulty: 'medium'
      }, {
        timeout: 3000000
      });
      
      // Generate practice questions
      const questionsPromise = axios.post(`${AI_SERVICE_URL}/api/questions/practice`, {
        subject: subject.name.toLowerCase(),
        topic: topic.toLowerCase(),
        grade: grade,
        difficulty: 'medium',
        count: 5
      }, {
        timeout: 3000000
      });
      
      const [scenarioResponse, questionsResponse] = await Promise.all([scenarioPromise, questionsPromise]);
      
      const scenario = scenarioResponse.data;
      const questions = questionsResponse.data?.questions || [];
      
      console.log(`  ✅ ${subject.name}: scenario + ${questions.length} questions generated`);
      console.log(`  📦 Scenario data:`, {
        hasNotes: !!scenario.notes,
        notesLength: scenario.notes?.length || 0,
        formulasCount: scenario.formulas?.length || 0,
        hasDerivations: !!(scenario.formulasAndDerivationsMarkdown || scenario.formulas_and_derivations_markdown),
        quizCount: scenario.quiz?.length || 0,
        keyConcepts: scenario.keyConcepts?.length || 0,
        learningObjectives: scenario.learningObjectives?.length || 0
      });
      
      return {
        subject: subject.name,
        topic: topic,
        scenario: scenario,
        questions: questions
      };
      
    } catch (error) {
      console.error(`  ⚠️ Failed for ${subject.name}:`, error.message);
      return null;
    }
  });
  
  const allContent = (await Promise.all(contentPromises)).filter(Boolean);
  
  // ============================================================
  // AGGREGATE ALL DATA FROM SCENARIOS
  // ============================================================
  console.log(`\n📦 Aggregating data from ${allContent.length} subjects...`);
  
  allContent.forEach(content => {
    const { scenario, questions } = content;
    
    // SIMPLIFIED: Just pass through the data as-is, like the normal app flow
    
    // 1. Notes - Direct from scenario
    if (scenario.notes) {
      kit.notes += (kit.notes ? '\n\n---\n\n' : '') + `## ${content.subject} - ${content.topic}\n\n${scenario.notes}`;
    }
    
    // 2. Formulas - Direct array from scenario
    if (scenario.formulas && Array.isArray(scenario.formulas)) {
      scenario.formulas.forEach(formula => {
        // Handle both string format and object format
        if (typeof formula === 'string') {
          kit.formulas.push({
            name: `${content.subject} Formula`,
            formula: formula,
            application: content.topic,
            units: 'As per NCERT'
          });
        } else if (typeof formula === 'object') {
          kit.formulas.push(formula);
        }
      });
    }
    
    // 3. Derivations - From formulasAndDerivationsMarkdown
    if (scenario.formulasAndDerivationsMarkdown || scenario.formulas_and_derivations_markdown) {
      const markdown = scenario.formulasAndDerivationsMarkdown || scenario.formulas_and_derivations_markdown;
      kit.derivations.push({
        title: `${content.subject} - ${content.topic}`,
        steps: [markdown],
        difficulty: scenario.difficultyLevel || scenario.difficulty_level || 'medium'
      });
    }
    
    // 4. PYQs - From quiz array (like normal app)
    if (scenario.quiz && Array.isArray(scenario.quiz)) {
      scenario.quiz.forEach(q => {
        kit.pyqs.push({
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          year: new Date().getFullYear(),
          examBoard: examBoard,
          marks: q.marks || 1,
          solution: q.explanation || '',
          difficulty: q.difficulty || 'medium'
        });
      });
    }
    
    // 5. Tips - From keyConcepts and learningObjectives (like normal app)
    if (scenario.keyConcepts || scenario.key_concepts) {
      const concepts = scenario.keyConcepts || scenario.key_concepts;
      concepts.forEach(concept => {
        const tip = concept.description || concept.details || '';
        if (tip) {
          kit.tips.push(tip);
        }
      });
    }
    
    if (scenario.learningObjectives || scenario.learning_objectives) {
      const objectives = scenario.learningObjectives || scenario.learning_objectives;
      objectives.forEach(obj => {
        const tip = obj.description || obj.details || '';
        if (tip) {
          kit.tips.push(tip);
        }
      });
    }
    
    // 6. Scenarios - Store complete scenario object (like normal app)
    kit.scenarios.push(scenario);
    
    // 7. Practice Questions - Direct from questions endpoint
    kit.practiceQuestions.push(...questions);
  });
  
  // Add some default tips if none extracted
  if (kit.tips.length === 0) {
    kit.tips = [
      'Read NCERT textbook thoroughly',
      'Practice all solved examples',
      'Solve all exercise problems',
      'Make formula sheets for quick revision',
      'Revise concepts regularly'
    ];
  }
  
  // Add default common mistakes
  kit.commonMistakes = [
    'Not reading theory sections carefully',
    'Skipping difficult problems',
    'Not practicing regularly',
    'Ignoring fundamental concepts'
  ];
  
  // ============================================================
  // FINAL SUMMARY
  // ============================================================
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ LEARNING KIT COMPLETE - Day ${dayPlan.day}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📊 Final counts:`, {
    notes: kit.notes ? `${kit.notes.length} chars` : 'empty',
    derivations: kit.derivations.length,
    formulas: kit.formulas.length,
    pyqs: kit.pyqs.length,
    tips: kit.tips.length,
    scenarios: kit.scenarios.length,
    practiceQuestions: kit.practiceQuestions.length
  });
  console.log(`${'='.repeat(60)}\n`);
  
  return kit;
}

/**
 * Generate comprehensive daily learning kit using AI service
 * Integrates: learning content + scenario generation + practice questions (same flow as home search)
 */
export async function generateDailyLearningKit(dayPlan, examBoard = 'CBSE', grade = 12) {
  try {
    console.log(`🔮 Generating comprehensive learning kit for Day ${dayPlan.day}...`);
    
    // Use ONLY existing scenario + questions endpoints (no custom exam-planning endpoints)
    const learningKit = await buildCompleteLearningKit(dayPlan, examBoard, grade);
    
    return learningKit;
    
  } catch (error) {
    console.error('❌ Learning kit generation failed:', error.message);
    
    // Fallback: Return basic structure
    const chapters = dayPlan.subjects.flatMap(s => s.chapters);
    
    return {
      notes: `Study NCERT chapters: ${chapters.join(', ')}. Focus on theory, worked examples, and end-of-chapter exercises.`,
      derivations: [],
      formulas: [],
      pyqs: [],
      tips: [
        'Read NCERT textbook thoroughly',
        'Practice all solved examples',
        'Solve all exercise problems'
      ],
      commonMistakes: [
        'Not reading theory sections carefully',
        'Skipping difficult problems'
      ],
      scenarios: [],
      practiceQuestions: []
    };
  }
}

// Rest of the code...
