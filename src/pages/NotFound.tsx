import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Translate } from "@/components/Translate";
import { ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="min-h-screen w-full bg-background bg-gradient-mesh noise overflow-hidden flex flex-col items-center justify-center relative px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          className="orb orb-primary w-[80vw] h-[80vh] absolute -top-1/4 -left-1/4"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="orb orb-accent w-[70vw] h-[70vh] absolute -bottom-1/4 -right-1/4"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -40, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <motion.div
        className="glass-card max-w-lg w-full p-8 md:p-12 flex flex-col items-center text-center relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {/* Animated Penman */}
        <motion.div
          className="relative mb-8"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <img
            src="/penman.png"
            alt="Penman"
            className="w-48 h-48 md:w-64 md:h-64 object-contain relative z-10 drop-shadow-2xl"
          />
        </motion.div>

        {/* Text Content */}
        <motion.h1
          className="text-6xl md:text-8xl font-bold text-gradient mb-2"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
        >
          404
        </motion.h1>

        <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground/90">
          <Translate>Lost in Space?</Translate>
        </h2>

        <p className="text-muted-foreground text-lg mb-10 max-w-md">
          <Translate>Even the best explorers get lost sometimes. Let's get you back to your learning journey.</Translate>
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <motion.button
            onClick={() => navigate(-1)}
            className="glass-button px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover-lift text-foreground/80 font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <Translate>Go Back</Translate>
          </motion.button>

          <motion.button
            onClick={() => navigate("/")}
            className="glass-button border-primary/20 bg-primary/5 px-8 py-3 rounded-xl flex items-center justify-center gap-2 hover-lift text-primary font-semibold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Home className="w-5 h-5" />
            <Translate>Back to Home</Translate>
          </motion.button>
        </div>
      </motion.div>

      {/* Footer deco */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground/40 text-sm font-medium tracking-widest uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        EdTech Assistant • Penman
      </motion.div>
    </motion.div>
  );
};

export default NotFound;
