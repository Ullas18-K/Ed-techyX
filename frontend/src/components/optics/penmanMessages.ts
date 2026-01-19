import { PenmanMessage } from '../assistant/Penman';

/**
 * Optics-specific Penman messages
 * 
 * This demonstrates how to define subject-specific messages for Penman.
 * Each task ID maps to instruction/completion messages.
 */
export const opticsPenmanMessages: Record<string, PenmanMessage> = {
    'task-1': {
        instruction: "Hey there! Let's start by exploring how light reflects. Switch to 'Mirror Mode' and drag the object up and down!",
        completion: "Awesome! Did you see that? The angle of reflection always equals the angle of incidence. That's the law of reflection!",
        hint: "Try moving the object to different heights and watch the ray angles change"
    },
    'task-2': {
        instruction: "Now let's see how distance works. Move the object closer and farther from the mirror.",
        completion: "Perfect! Notice how the image distance is always exactly the same as the object distance in a plane mirror.",
        hint: "Drag the object horizontally to see the relationship between distances"
    },
    'task-3': {
        instruction: "Time to bend some minds... and mirrors! Try changing the mirror to 'Concave' and see what happens to the image.",
        completion: "Whoa! Concave mirrors can flip things upside down depending on where you stand. That's a real image!",
        hint: "Try positioning the object at different distances from the mirror"
    },
    'task-4': {
        instruction: "Let's switch gears to Lenses! Change back to 'Lens Mode' and pick a Convex lens. Watch how light bends!",
        completion: "You got it! That bending is called Refraction. It happens because light changes speed when it enters the glass.",
        hint: "Notice how rays bend toward the normal when entering the lens"
    },
    'task-5': {
        instruction: "Let's change the material! Use the 'Refractive Index' slider to make the lens made of something denser, like diamond!",
        completion: "See that? Higher refractive index means more bending. That's why diamonds sparkle so much!",
        hint: "Try values like 1.3 (water), 1.5 (glass), and 2.4 (diamond)"
    },
    'task-6': {
        instruction: "This is a tricky one. Increase the angle of incidence really high until the light doesn't escape anymore!",
        completion: "BAM! Total Internal Reflection! The light is trapped inside. That's exactly how fiber optic internet cables work!",
        hint: "Gradually increase the angle until you see total internal reflection"
    },
    'task-7': {
        instruction: "Let's compare! Try a Concave lens now. Does it ever form a real image?",
        completion: "Correct! Concave lenses always make things look smaller and upright. They are virtual images.",
        hint: "Compare the image characteristics with those from a convex lens"
    },
    'task-8': {
        instruction: "Final challenge! Make the image HUGE. Place the object between the focal point (F) and 2F of a convex lens.",
        completion: "You did it! You're basically building a projector now. Great work completing the Optics Training!",
        hint: "Position the object between one and two focal lengths from the lens"
    }
};
