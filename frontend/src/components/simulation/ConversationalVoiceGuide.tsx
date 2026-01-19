import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechSynthesis } from 'react-speech-kit';
import { 
  Volume2, 
  VolumeX, 
  Pause, 
  Play,
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  Target,
  Lightbulb,
  MessageCircle,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Task {
  id: number;
  instruction: string;
  checkQuestion: string;
  encouragement: string;
  hint?: string;
  expectedAction?: string;
  completed: boolean;
}

interface ConversationalVoiceGuideProps {
  topicName: string;
  simulationType: string;
  onTaskComplete?: (taskId: number) => void;
  onClose?: () => void;
}

const conversationalTasks: Record<string, {
  greeting: string;
  tasks: Omit<Task, 'completed'>[];
  celebration: string;
}> = {
  photosynthesis: {
    greeting: "Hey there, my curious learner! Welcome, welcome, welcome! I'm absolutely thrilled to have you here today! We're about to embark on an incredible journey into the world of plants and photosynthesis. This is seriously one of the most amazing processes in nature! Did you know that every single plant around you is basically a tiny factory that turns sunlight into food? How cool is that? And today, you're going to see it happen right before your eyes in this simulation! So, take a deep breath, get comfortable, and let's dive into this amazing adventure together. Are you ready to become a photosynthesis expert? Let's go!",
    tasks: [
      {
        id: 1,
        instruction: "Alright, my friend, let's begin our adventure! First things first - I need you to look at the simulation screen in front of you. Can you see that beautiful little plant sitting in its pot? Isn't it lovely? Now, take a moment to look at the left side of the screen. Do you see those three sliders? Those are your control panel! Each one of these represents something very important that plants need to survive and perform photosynthesis. We have three main ingredients in photosynthesis: sunlight, water, and carbon dioxide. Just like you need food and water and air to survive, plants need these three things to make their own food. The controls you see let you adjust each of these ingredients. Pretty neat, right? Now, let's start with the most important ingredient - sunlight! The sun is like nature's energy machine, and plants absolutely need it.",
        checkQuestion: "Now, here's what I want you to do: can you find the sunlight slider and move it to about 50 percent? Just grab that slider and drag it towards the middle. Take your time, there's no rush! Tell me when you've done it.",
        encouragement: "Oh wow, excellent work! Look at that - did you see how the sun got brighter on the screen? And look at the plant - it's already starting to respond! The plant is literally feeling the energy from the sunlight. This is the beginning of photosynthesis happening right in front of us! You're doing absolutely fantastic! I'm so impressed with how quickly you're picking this up!",
        hint: "Look on the left side of your screen - you should see a slider labeled 'Sunlight' or something similar. Just click on it and drag it to the middle. You're looking for about 50 on the scale!",
        expectedAction: "adjust_sunlight"
      },
      {
        id: 2,
        instruction: "Amazing! You're doing brilliantly! Now, let me tell you something really cool about what just happened. That sunlight we just gave the plant? That's energy! Pure energy from the sun! But here's the thing - the plant can't do it all alone. It needs another ingredient, and that's water! Think about it - when you're working hard and putting in effort, you need water to stay hydrated, right? Well, plants are the same way, except they need water for a completely different reason. Water is one of the raw materials that plants use to create their food. Without water, even with all the sunlight in the world, the plant can't make glucose, which is basically plant food. Water is absolutely essential! So let's give our plant some water now.",
        checkQuestion: "Can you locate the water slider? It should be right below the sunlight slider you just adjusted. Go ahead and move it up to about 50 percent as well. Just like we did with the sunlight! Tell me when you've adjusted it!",
        encouragement: "Perfect! Wonderful! Look at that - the plant is getting healthier already! Do you see how it looks more vibrant? The water is actually being absorbed into the plant right now. Water travels through the roots up into the leaves. And when sunlight hits those leaves with water inside them, something magical starts to happen - photosynthesis! You can already see the difference, can't you? This is real plant biology happening in real-time! You're learning and observing like a true scientist!",
        hint: "The water slider is the middle one on the left side. It should be labeled something like 'Water' or 'H2O'. Just click and drag it to the middle, to about 50 percent!",
        expectedAction: "adjust_water"
      },
      {
        id: 3,
        instruction: "Oh my goodness, you're doing so well! Now we have sunlight and water - two out of three ingredients! But wait, there's one more crucial ingredient we absolutely cannot forget, and this one is really fascinating! It's carbon dioxide, or CO2. Now, you might be thinking - wait, isn't carbon dioxide something bad? We hear about it in the news all the time! But here's the amazing thing: for plants, CO2 is essential! It's literally the air that plants breathe! While we breathe in oxygen and breathe out carbon dioxide, plants do the opposite! They take in carbon dioxide and release oxygen - the oxygen that we need to survive! Isn't that beautiful? It's like nature's perfect exchange program! Plants breathe in our waste, and we breathe in their waste. It's incredible symbiosis! So now, let's add carbon dioxide to our plant and watch the magic happen!",
        checkQuestion: "Can you find the carbon dioxide slider? It should be the third slider on the left. Go ahead and adjust it to about 50 percent, just like the other two. Once you do that, you'll see something really special - you'll start to see little bubbles appear! Those bubbles are oxygen that the plant is producing! Tell me when you've set it!",
        encouragement: "Oh WOW! Look at that! Do you see those tiny bubbles? Those are oxygen molecules! The plant is literally creating oxygen right now! Every single bubble you see represents oxygen being released into the air. And that oxygen? That's what we breathe! So in a very real sense, this little plant is giving you air to breathe! Isn't that absolutely amazing? You're watching one of the most important biological processes on Earth unfold right before your eyes! The plant is taking in sunlight, water, and carbon dioxide and turning it into food and oxygen. This is photosynthesis in action!",
        hint: "Look for the third slider on the left side - it should say something like 'Carbon Dioxide' or 'CO2'. Move it to the middle, to 50 percent!",
        expectedAction: "adjust_co2"
      },
      {
        id: 4,
        instruction: "This is so exciting! We now have all three ingredients combined - sunlight, water, and carbon dioxide! And look at your plant - it's looking healthy and happy! Now I want to show you something really special. We can actually run an experiment to see the exact results of photosynthesis. There's usually a button on the screen that says 'Run Experiment' or something similar. When you click this button, the simulation will show us the data - how much glucose the plant produced, how much oxygen was released, how fast the process is happening. This is where the real science happens! We get to see the numbers, the measurements, the actual data behind this beautiful process. Scientists use data like this to understand how plants work and how we can help them grow better.",
        checkQuestion: "Now, I want you to look for the 'Run Experiment' button - it's usually a big, colorful button somewhere near the sliders. Can you see it? Once you find it, go ahead and click it! I'm so excited to see what the results are! Tell me when you've clicked it!",
        encouragement: "YES! Look at all that data! Can you see the numbers? Look at the glucose production - the plant is creating its own food! And look at the oxygen release - the plant is producing oxygen at a fantastic rate! This is photosynthesis working at a healthy level! The experiment shows us exactly what's happening at the molecular level. The plant took in 6 molecules of carbon dioxide and 6 molecules of water, used the energy from sunlight, and created glucose for food and oxygen to release. This is the actual chemical equation of photosynthesis playing out in real life! You're not just reading about it in a textbook - you're seeing it happen! This is incredible!",
        hint: "Look for a button that says 'Run Experiment' - it's usually green or highlighted in some way. It should be near your sliders. Click on it and watch the magic happen!",
        expectedAction: "run_experiment"
      },
      {
        id: 5,
        instruction: "Okay, now we're going to do something really fun and educational. We're going to test a hypothesis! See, now that we understand that all three ingredients are needed, let's see what happens when we remove one. This is called testing a limiting factor. A limiting factor is the ingredient that is in the shortest supply and limits how much photosynthesis can happen. Let me ask you - what do you think happens if a plant gets tons of sunlight but has no water? Think about it for a second. I'll wait... The answer is that the plant would struggle! Without water, even with perfect sunlight, photosynthesis can't happen! Water is essential. So let's test this hypothesis together!",
        checkQuestion: "Here's what I want you to do: Keep the sunlight slider where it is - nice and high. Keep the CO2 where it is too. But now, take the water slider and drag it ALL the way down to zero. I want you to see what happens when you remove the water from the equation. Go ahead, try it! Tell me what you observe!",
        encouragement: "Do you see what happened? The plant isn't doing well, is it? Look at it - it's struggling, the health indicator has dropped! This demonstrates something really important in biology called the 'Limiting Factor Principle.' Even though the plant has plenty of sunlight and carbon dioxide, without water, photosynthesis can't work properly! Water was the limiting factor - the ingredient in shortest supply. This principle applies to everything in nature. A plant's growth is limited by whichever ingredient it has the least of! This is why farmers are so concerned about water in dry regions - if there's no water, even with perfect sunlight, nothing grows!",
        hint: "Find the water slider - it's the middle one on the left. Now drag it all the way to the left, to zero. Watch what happens to the plant!",
        expectedAction: "test_limiting_factor"
      },
      {
        id: 6,
        instruction: "Perfect! You just discovered the limiting factor principle! That's real agricultural science right there! Now, let's find the sweet spot - the optimal conditions where the plant thrives the most! Scientists have done extensive research and found that there's a perfect balance of all three ingredients where photosynthesis works at its absolute best. It's not always exactly 50/50/50 - it depends on the plant and the environment. But there's definitely a range where plants are happiest and most productive. Let's set up those ideal conditions and watch our plant flourish!",
        checkQuestion: "Here's what I want you to do: adjust all three sliders - sunlight, water, and CO2 - to about 70 percent each. That's the sweet spot where everything is balanced and optimal! Go ahead and move all three sliders to around 70. Don't worry if it's not exact - just get them all near that area. Tell me when you've done it!",
        encouragement: "Oh my goodness, look at your plant now! Look how vibrant and healthy it is! Look at those oxygen bubbles flowing! This is a plant at peak performance! With 70 percent sunlight, 70 percent water, and 70 percent CO2, the plant is absolutely thriving! This is photosynthesis working at its optimal rate! The plant is producing maximum glucose for growth and maximum oxygen for the atmosphere. This is what a healthy, happy plant looks like! If we looked at a real plant in nature getting these ideal conditions, this is exactly what we'd see - a thriving, green, productive plant!",
        hint: "You need to adjust all three sliders - sunlight, water, and carbon dioxide - to around 70 percent. Get them all to approximately the same level. You're looking for a nice balanced setup!",
        expectedAction: "optimize_all"
      },
      {
        id: 7,
        instruction: "Fantastic! You've now learned the fundamentals of photosynthesis! You understand the three key ingredients, you know how they work together, you've seen what happens when one is missing, and you know what optimal conditions look like! Now comes the fun part - you get to be a real scientist and experiment! I want you to try different combinations. What happens if you maximize sunlight but minimize water? What about high CO2 but low sunlight? What happens with extreme values? Play around, form hypotheses about what you think will happen, and then test them! This is exactly how real scientists work - they have questions, make predictions, run experiments, and observe results! You're thinking like a true scientist now!",
        checkQuestion: "I want you to try at least two different combinations. Maybe one extreme and one moderate. Watch what happens to the plant's health and the oxygen production. Try combinations you think will be interesting! Once you've done at least two experiments and observed the results, tell me what you've discovered!",
        encouragement: "Absolutely amazing! Look at all those experiments you just ran! You tested different hypotheses, observed the results, and drew conclusions! You just did real scientific research! You can see how each variable affects the outcome. You understand cause and effect in photosynthesis. You're not just memorizing facts - you're genuinely understanding how this system works! This is the kind of deep learning that makes you a real scientist!",
        hint: "Try changing the sliders to different values and watch what happens. Maybe try 100 sunlight with 0 water. Or 50 sunlight with 100 CO2. Be creative and explore!",
        expectedAction: "free_experiment"
      }
    ],
    celebration: "Oh my goodness, YOU DID IT! I am absolutely thrilled! Give yourself a massive pat on the back! You have completely mastered photosynthesis! Think about what you've learned today: you understand that photosynthesis requires three essential ingredients - sunlight, water, and carbon dioxide. You know that plants use these ingredients to create glucose for food and oxygen as a byproduct. You understand the limiting factor principle and how to find optimal conditions. You've run experiments, tested hypotheses, and made observations like a real scientist! This is incredible! You now know that every plant on Earth is constantly using photosynthesis to feed itself and produce oxygen for us to breathe. When you look at a plant from now on, you'll understand the amazing process happening inside those leaves! You should be so proud of yourself! This is real, genuine understanding of one of the most important processes on our planet! Do you have any questions about photosynthesis? I'm here to discuss anything with you! Or if you want to explore more, we can dive deeper into any aspect! Thank you for being such an amazing student today!"
  },
  circuit: {
    greeting: "Hello, brilliant student! Welcome to the fascinating world of electrical circuits! I am so pumped to guide you through this amazing journey! Now, I know electricity might seem mysterious or complicated, but I promise you, once you understand the basics, you'll see electricity everywhere! Electricity powers everything - your phone, your lights, your computer, everything! And today, you're going to understand how it actually works! We're going to explore the fundamental principles of electricity and circuits together. By the end of this, you'll understand concepts like voltage, current, resistance, and Ohm's Law - the same principles that electrical engineers use to design all the technology around us! So let's get started on this incredible adventure!",
    tasks: [
      {
        id: 1,
        instruction: "Perfect! Let's start with the basics. I want you to look at the simulation screen and observe what we have here. Do you see a circuit diagram? A circuit is basically a complete path that electricity flows through. Think of it like a racetrack - the electrons need a complete loop to travel around. Now, looking at your diagram, do you see a rectangle on the left side? That's a battery! The battery is the power source - it's the thing that makes the electrons want to move. Batteries have a positive terminal and a negative terminal, kind of like a magnet has north and south poles. Then, do you see a circle on the right side? That's a light bulb! The bulb has resistance inside it, and when electricity flows through it, it lights up because the electrons collide with atoms and release energy as light and heat. And finally, do you see the lines connecting everything? Those are wires! The wires are the pathway that electricity travels through. For electricity to flow, we need a complete, unbroken path from the battery, through the bulb, and back to the battery. That's what a circuit is!",
        checkQuestion: "Now I want you to take a moment and really observe the circuit. Can you see the battery on the left, the bulb on the right, and the wires connecting them? Take your time and look carefully. Once you've identified all the parts, tell me what you see!",
        encouragement: "Excellent observation! You've already identified the key components of a circuit! You can see how simple but elegant this design is. This is a basic circuit, and it's the foundation of all electronics! Understanding this simple circuit means you understand the principle behind everything from your flashlight to your computer! You're thinking like an electrical engineer right now!",
        hint: "Look at the screen - find the battery symbol on the left, the light bulb symbol on the right, and follow the wires connecting them around the circuit!",
        expectedAction: "observe_circuit"
      },
      {
        id: 2,
        instruction: "Great! Now let's talk about voltage! Voltage is one of the most important concepts in electricity, so I want you to really understand it. Think of voltage like water pressure in a hose. If you have high water pressure, water flows fast and hard. If you have low pressure, water dribbles out. Voltage works the same way! Voltage is the electrical pressure - the push that makes electrons want to move! A higher voltage means more push, more energy driving the electrons around the circuit. The voltage is measured in volts, and the battery is what creates this voltage. Different batteries have different voltages. A typical AA battery is 1.5 volts. A car battery is 12 volts. The wall socket in your house is 120 volts! Now, in our simulation, we can adjust the voltage using that slider, and we'll see how it affects the brightness of the bulb and the amount of current flowing. Let's start with a typical voltage level.",
        checkQuestion: "I want you to find the voltage slider and set it to 6 volts. That's a good starting point - like the voltage in some rechargeable batteries. Go ahead and adjust it, and watch what happens to the bulb! Tell me when you've set it!",
        encouragement: "Great! Look at that - the bulb is lighting up! Do you see that glow? That's electricity flowing through the circuit! The 6 volts is pushing the electrons through the bulb, and when they collide with the atoms in the filament, they produce light! This is real physics happening right now! The brighter the glow, the more electrical energy is being converted to light energy!",
        hint: "Find the voltage slider - it should be clearly labeled. Move it until it shows 6 volts!",
        expectedAction: "set_voltage"
      },
      {
        id: 3,
        instruction: "Perfect! Now let's talk about resistance! This is a fascinating concept! Resistance is exactly what it sounds like - it's resistance to the flow of electricity. Think about it like this: if you have a wide, smooth pipe, water flows easily. But if you have a narrow, bumpy pipe, the water has to push hard to get through - there's more resistance! Electricity works the same way! Resistance is measured in ohms, named after Georg Simon Ohm, who discovered this principle! In our circuit, the light bulb has resistance. The wire has a tiny bit of resistance too. When electricity flows through something with resistance, the electrons collide with atoms, and this collision releases energy - sometimes as heat, sometimes as light! In the light bulb, that's exactly what we want - we want the resistance so that the bulb glows! Now, here's the relationship: if we increase resistance while keeping voltage the same, the current decreases! Less electricity flows! If we decrease resistance, more electricity flows! Let's see this relationship in action!",
        checkQuestion: "I want you to find the resistance slider and set it to 10 ohms. So we have 6 volts and 10 ohms now. Go ahead and set it, and notice the behavior of the bulb! Tell me when you've done it!",
        encouragement: "Excellent! Now we have 6 volts and 10 ohms set. Look at the bulb - it's glowing! This is perfect because now we can calculate the current using Ohm's Law! The relationship is: voltage equals current times resistance, or V equals I times R. If we rearrange it, current equals voltage divided by resistance! So 6 volts divided by 10 ohms equals 0.6 amperes! That's the amount of current flowing through your circuit right now! Isn't it amazing that we can predict exactly how much current will flow just by knowing the voltage and resistance?",
        hint: "Find the resistance slider and move it to 10 ohms!",
        expectedAction: "set_resistance"
      },
      {
        id: 4,
        instruction: "Fantastic! Now we're ready to see Ohm's Law in action! Ohm's Law is one of the most fundamental principles in electricity, and it's actually pretty simple! The law states that the current flowing through a circuit equals the voltage divided by the resistance. Voltage divided by resistance equals current! We already set up perfect values to demonstrate this: 6 volts divided by 10 ohms equals 0.6 amperes! Now, when you run the experiment, the simulation will show you exactly this result! This is one of the most important relationships in electricity! Ohm's Law works for everything electrical - from simple circuits like ours to complex electronics like computers! This single principle explains so much about how electricity behaves!",
        checkQuestion: "Now I want you to find and click the 'Run Experiment' button! This will run the simulation and show us the data - it will calculate and display the current! I can't wait to see the results! Go ahead and click it!",
        encouragement: "YES! Look at that! The current reading shows 0.6 amperes! That's exactly what Ohm's Law predicted! Voltage divided by resistance equals current! 6 divided by 10 equals 0.6! This is the power of Ohm's Law - we can predict exactly what will happen! Science is amazing! You just witnessed one of the most fundamental laws of physics playing out right in front of you! This principle is used to design every electrical device on Earth!",
        hint: "Look for a button labeled 'Run Experiment' and click it!",
        expectedAction: "run_circuit_experiment"
      },
      {
        id: 5,
        instruction: "Alright, now let's do something really exciting! We're going to test what happens when we change the voltage! This is where it gets really cool! I want you to think about this: if we double the voltage while keeping the resistance the same, what do you think will happen to the current? Think about it... If voltage goes up and resistance stays the same, then current must go up too! In fact, it should double! Let me explain why: remember Ohm's Law? Current equals voltage divided by resistance. If we double the voltage and keep resistance constant, the current will exactly double! And if the current doubles, the light bulb will get brighter because more electricity is flowing through it! Let's test this hypothesis!",
        checkQuestion: "Keep the resistance at 10 ohms where it is. Now, I want you to find the voltage slider and increase it to 12 volts - that's double what we had before! Watch what happens to the bulb as you do it! Tell me when you've changed it!",
        encouragement: "Oh WOW! Look at that! The bulb is much brighter now, isn't it? And if you look at the current, it should show 1.2 amperes instead of 0.6! That's exactly double! Double the voltage equals double the current! This shows the direct proportional relationship between voltage and current! As voltage increases, current increases proportionally! The brighter bulb is your visual proof that more current is flowing! This is why higher voltage devices are more powerful - they push more current through, releasing more energy!",
        hint: "Move the voltage slider from 6 volts to 12 volts. Watch the bulb get brighter!",
        expectedAction: "double_voltage"
      },
      {
        id: 6,
        instruction: "Perfect! Now let's explore the opposite effect - what happens when we increase resistance! This is equally important! Remember, resistance is like friction. Higher resistance makes it harder for electricity to flow. So if we keep voltage constant but increase resistance, what will happen to the current? It should decrease! In fact, using Ohm's Law: if resistance doubles while voltage stays the same, the current will be cut in half! We have 12 volts now. If we keep it there and increase resistance to 20 ohms, the current will drop to 0.6 amperes - half of what it was! And when the current drops, the light bulb gets dimmer! Let's test this!",
        checkQuestion: "Keep the voltage at 12 volts. Now find the resistance slider and increase it to 20 ohms - that's double what it was before. Watch what happens to the bulb! Tell me when you've done it!",
        encouragement: "Look at that! The bulb got dimmer, didn't it? And the current dropped to 0.6 amperes! Even though we have higher voltage now compared to before, the much higher resistance restricts the current flow so much that we actually have less current now than when we had 6 volts and 10 ohms! This demonstrates an important principle: resistance limits current flow. The higher the resistance, the lower the current, and the dimmer the light! This is why electrical wires need to have very low resistance - if wires had high resistance, they would get hot and waste energy!",
        hint: "Move the resistance slider to 20 ohms while keeping voltage at 12 volts!",
        expectedAction: "increase_resistance"
      }
    ],
    celebration: "Absolutely fantastic! YOU NAILED IT! I am genuinely impressed! You have mastered the fundamentals of electrical circuits! Think about what you've accomplished today: You understand the basic circuit components - the battery, the load (light bulb), and the wires! You understand voltage - the electrical pressure that drives electrons! You understand resistance - the opposition to electrical flow! And most importantly, you understand Ohm's Law - the relationship between voltage, current, and resistance! You've seen how doubling voltage doubles the current! You've seen how increasing resistance decreases the current! You understand cause and effect in electrical circuits! You've experienced real physics and real mathematics working together! This is incredible! Every electrical engineer started exactly where you are now - understanding these fundamentals! From here, these principles extend to everything electronic - computers, phones, power grids, everything! You should be incredibly proud of yourself! You now understand electricity in a way that most people never do! Do you have any questions? I'm here to explore any aspect of circuits with you further!"
  }
};

export function ConversationalVoiceGuide({ 
  topicName, 
  simulationType,
  onTaskComplete,
  onClose 
}: ConversationalVoiceGuideProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(-1);
  const [conversationPhase, setConversationPhase] = useState<'greeting' | 'instruction' | 'waiting' | 'checking' | 'encouragement' | 'completed'>('greeting');
  const [isListening, setIsListening] = useState(false);
  const [userResponse, setUserResponse] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const { speak, cancel, speaking, supported, voices } = useSpeechSynthesis();
  const recognitionRef = useRef<any>(null);
  
  const guidance = conversationalTasks[simulationType] || conversationalTasks.photosynthesis;

  // Initialize tasks
  useEffect(() => {
    const initialTasks = guidance.tasks.map(t => ({ ...t, completed: false }));
    setTasks(initialTasks);
  }, [simulationType]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript.toLowerCase();
          setUserResponse(transcript);
          handleVoiceResponse(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          setIsListening(false);
          if (event.error !== 'no-speech') {
            toast.error('Microphone error. You can also type your response!');
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      cancel();
    };
  }, []);

  const speakText = (text: string, onEnd?: () => void) => {
    cancel();
    
    const voice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex')) 
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0];

    speak({ 
      text,
      voice,
      rate: 0.95,
      pitch: 1.05,
      onEnd
    });
  };

  const startGreeting = () => {
    setHasStarted(true);
    setConversationPhase('greeting');
    speakText(guidance.greeting, () => {
      setTimeout(() => {
        setCurrentTaskIndex(0);
        startTask(0);
      }, 2000);
    });
  };

  const startTask = (taskIndex: number) => {
    if (taskIndex >= tasks.length) {
      completeCourse();
      return;
    }

    const task = tasks[taskIndex];
    setConversationPhase('instruction');
    
    // Speak the full instruction + question combination
    const fullTaskText = `${task.instruction}\n\n${task.checkQuestion}`;
    
    speakText(task.instruction, () => {
      setTimeout(() => {
        setConversationPhase('waiting');
        speakText(task.checkQuestion, () => {
          setConversationPhase('checking');
          setTimeout(() => {
            toast.info('🎤 Say "yes" when you complete this task, "hint" for help, or "repeat" to hear again');
          }, 500);
        });
      }, 1200);
    });
  };

  const handleVoiceResponse = (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Handle common responses
    if (lowerTranscript.includes('yes') || lowerTranscript.includes('yeah') || lowerTranscript.includes('done') || 
        lowerTranscript.includes('ready') || lowerTranscript.includes('finished') || lowerTranscript.includes('completed')) {
      confirmTaskCompletion();
    } else if (lowerTranscript.includes('help') || lowerTranscript.includes('hint') || lowerTranscript.includes('stuck')) {
      provideHint();
    } else if (lowerTranscript.includes('repeat') || lowerTranscript.includes('again')) {
      repeatInstruction();
    } else if (lowerTranscript.includes('skip')) {
      skipToNext();
    } else {
      toast.info(`I heard: "${transcript}". Say "yes" when done, "hint" for help, or "repeat"!`);
    }
  };

  const confirmTaskCompletion = () => {
    const currentTask = tasks[currentTaskIndex];
    if (!currentTask) return;

    setConversationPhase('encouragement');
    
    // Mark task as completed
    const updatedTasks = [...tasks];
    updatedTasks[currentTaskIndex] = { ...currentTask, completed: true };
    setTasks(updatedTasks);
    
    if (onTaskComplete) {
      onTaskComplete(currentTask.id);
    }

    speakText(currentTask.encouragement, () => {
      setTimeout(() => {
        const nextIndex = currentTaskIndex + 1;
        
        if (nextIndex < tasks.length) {
          // Announce the next task coming up
          speakText(`Great! Now let's move to Step ${nextIndex + 1}.`, () => {
            setTimeout(() => {
              setCurrentTaskIndex(nextIndex);
              setTimeout(() => startTask(nextIndex), 1000);
            }, 800);
          });
        } else {
          // All tasks complete
          setTimeout(() => {
            completeCourse();
          }, 2000);
        }
      }, 1500);
    });
  };

  const provideHint = () => {
    const currentTask = tasks[currentTaskIndex];
    if (currentTask?.hint) {
      setShowHint(true);
      speakText(`Here's a hint: ${currentTask.hint}`, () => {
        setTimeout(() => {
          setShowHint(false);
          speakText("Let me know when you've completed this step.");
        }, 3000);
      });
    }
  };

  const repeatInstruction = () => {
    const currentTask = tasks[currentTaskIndex];
    if (currentTask) {
      speakText(currentTask.instruction, () => {
        setTimeout(() => {
          speakText(currentTask.checkQuestion);
        }, 1000);
      });
    }
  };

  const skipToNext = () => {
    const currentTask = tasks[currentTaskIndex];
    const nextIndex = currentTaskIndex + 1;
    
    if (nextIndex >= tasks.length) {
      completeCourse();
      return;
    }

    // Mark current as completed if not already
    const updatedTasks = [...tasks];
    updatedTasks[currentTaskIndex] = { ...currentTask, completed: true };
    setTasks(updatedTasks);

    speakText("Okay, let's move on to the next step!", () => {
      setTimeout(() => {
        setCurrentTaskIndex(nextIndex);
        setTimeout(() => startTask(nextIndex), 1000);
      }, 800);
    });
  };

  const completeCourse = () => {
    setConversationPhase('completed');
    speakText(guidance.celebration);
    toast.success('🎉 Congratulations! You completed all tasks!');
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info('🎤 Listening... Speak now!');
      } catch (error) {
        toast.error('Could not start microphone');
      }
    }
  };

  const handleManualComplete = () => {
    confirmTaskCompletion();
  };

  if (!hasStarted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-6 z-50"
      >
        <div className="glass-card border border-white/20 backdrop-blur-2xl rounded-2xl shadow-lg overflow-hidden p-6 w-[420px] bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h3 className="font-bold text-lg text-foreground">AI Learning Guide</h3>
                <p className="text-xs text-muted-foreground">Your Personal Tutor</p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-foreground/80 mb-6 leading-relaxed">
            Let me guide you through this simulation step by step. We'll have a real conversation, and I'll help you truly understand every concept. Are you ready?
          </p>
          
          <Button 
            onClick={startGreeting} 
            className="w-full gap-2 h-11 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            <Play className="w-5 h-5" />
            Start Learning
          </Button>
        </div>
      </motion.div>
    );
  }

  const currentTask = tasks[currentTaskIndex];
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 left-6 z-50 w-[520px]"
    >
      <div className="glass-card border border-white/20 backdrop-blur-2xl rounded-2xl shadow-xl overflow-hidden bg-gradient-to-br from-primary/5 via-card/30 to-accent/5">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2.5 rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg"
                animate={speaking ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 0.8, repeat: speaking ? Infinity : 0 }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h3 className="font-bold text-foreground">AI Learning Guide</h3>
                <p className="text-xs text-muted-foreground">
                  {conversationPhase === 'completed' ? '✨ Session Complete!' : `Step ${currentTaskIndex + 1} of ${tasks.length}`}
                </p>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="font-medium">{completedCount} completed</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 bg-secondary rounded-full overflow-hidden border border-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent shadow-lg"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Task Steps Indicator */}
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {tasks.map((task, idx) => (
              <motion.div
                key={task.id}
                animate={{
                  scale: idx === currentTaskIndex ? 1.1 : 1,
                }}
                className={cn(
                  "h-2 rounded-full transition-all",
                  task.completed 
                    ? "bg-success" 
                    : idx === currentTaskIndex
                    ? "bg-gradient-to-r from-primary to-accent"
                    : "bg-secondary/50"
                )}
                title={`Step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Current Task Display */}
        <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto">
          <AnimatePresence mode="wait">
            {currentTask && conversationPhase !== 'completed' && (
              <motion.div
                key={currentTask.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Task Title */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-2 rounded-lg transition-all",
                    currentTask.completed 
                      ? "bg-success/20" 
                      : "bg-primary/20"
                  )}>
                    {currentTask.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <Target className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">
                    {currentTask.completed ? '✓ Completed' : 'In Progress'}
                  </h4>
                </div>
                
                {/* AI Message Box */}
                {conversationPhase !== 'greeting' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-white">AI</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-foreground leading-relaxed">
                          {conversationPhase === 'instruction' && currentTask.instruction}
                          {conversationPhase === 'waiting' && currentTask.checkQuestion}
                          {conversationPhase === 'checking' && "I'm listening carefully to your response..."}
                          {conversationPhase === 'encouragement' && currentTask.encouragement}
                        </p>
                        
                        {speaking && (
                          <motion.div
                            className="flex gap-1.5 items-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1.5 h-5 bg-gradient-to-b from-primary to-accent rounded-full"
                                animate={{
                                  scaleY: [1, 1.4, 1],
                                }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                  delay: i * 0.1,
                                }}
                              />
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Hint */}
                {showHint && currentTask.hint && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                      {currentTask.hint}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {conversationPhase === 'completed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg"
                >
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>
                <div className="space-y-2">
                  <h3 className="font-bold text-xl text-foreground">Excellent Work! 🌟</h3>
                  <p className="text-sm text-muted-foreground">
                    You've mastered all concepts in this {topicName} learning module!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        {conversationPhase !== 'completed' && (
          <div className="p-5 border-t border-white/10 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 space-y-3">
            {/* Voice Input */}
            <div className="flex gap-2">
              <Button
                onClick={toggleListening}
                variant={isListening ? "default" : "outline"}
                className={cn(
                  "flex-1 gap-2 h-10 text-sm font-medium",
                  isListening && "animate-pulse bg-gradient-to-r from-primary to-accent text-white border-0"
                )}
              >
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                {isListening ? "Listening..." : "Speak Response"}
              </Button>
              
              <Button 
                onClick={handleManualComplete} 
                variant="outline" 
                className="flex-1 gap-2 h-10 text-sm font-medium border-primary/20 hover:bg-primary/5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Done
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={provideHint}
                className="flex-1 text-xs h-9 hover:bg-amber-500/10 hover:text-amber-600"
              >
                <Lightbulb className="w-3 h-3 mr-1" />
                Hint
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={repeatInstruction}
                className="flex-1 text-xs h-9 hover:bg-primary/10 hover:text-primary"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Repeat
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  cancel();
                  speaking ? toast.info('Speech stopped') : toast.info('Not speaking');
                }}
                className="flex-1 text-xs h-9 hover:bg-red-500/10 hover:text-red-600"
              >
                {speaking ? <Pause className="w-3 h-3 mr-1" /> : <VolumeX className="w-3 h-3 mr-1" />}
                {speaking ? 'Pause' : 'Mute'}
              </Button>
            </div>

            {/* Help Text */}
            <p className="text-center text-xs text-muted-foreground">
              Say "yes" when done • "hint" for help • "repeat" to hear again
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
