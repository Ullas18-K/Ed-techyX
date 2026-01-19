import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Camera, Sparkles, RefreshCw, Download, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Translate } from '@/components/Translate';
import { Navbar } from '@/components/Navbar';
import { Penman } from '@/components/assistant/Penman';
import { jsPDF } from "jspdf";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface AnalysisResult {
    is_ncert: boolean;
    grade?: string;
    subject?: string;
    chapter?: string;
    answer?: string;
    extracted_question: string;
    status: string;
    message?: string;
}

const UploadAndLearn: React.FC = () => {
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file (JPG/PNG)');
                return;
            }
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResult(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResult(null);
        }
    };

    const handleReset = () => {
        setSelectedImage(null);
        setPreviewUrl(null);
        setResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDownloadPDF = () => {
        if (!result || !result.is_ncert) return;

        const doc = new jsPDF();
        const margin = 20;
        const width = doc.internal.pageSize.getWidth() - 2 * margin;
        let y = 30;

        // Title
        doc.setFontSize(22);
        doc.setTextColor(30, 58, 138); // Navy blue
        doc.text("EduVerse - NCERT Solution", margin, y);
        y += 15;

        // Metadata
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Subject: ${result.subject} | Class: ${result.grade}`, margin, y);
        y += 10;
        doc.text(`Chapter: ${result.chapter}`, margin, y);
        y += 15;

        // Question
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("Question:", margin, y);
        y += 10;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        const questionLines = doc.splitTextToSize(`"${result.extracted_question}"`, width);
        doc.text(questionLines, margin, y);
        y += (questionLines.length * 7) + 15;

        // Answer
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Solution:", margin, y);
        y += 10;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);

        // Clean markdown for PDF
        const cleanAnswer = (result.answer || "")
            .replace(/#{1,6}\s?/g, '') // Remove headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/`(.*?)`/g, '$1') // Remove code blocks
            .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Remove links

        const answerLines = doc.splitTextToSize(cleanAnswer, width);

        // Add pages if answer is long
        answerLines.forEach((line: string) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, margin, y);
            y += 6;
        });

        doc.save(`NCERT_Solution_${result.subject}_Class${result.grade}.pdf`);
        toast.success("PDF Downloaded!");
    };

    const handleAnalyze = async () => {
        if (!selectedImage) return;

        setIsAnalyzing(true);

        const formData = new FormData();
        formData.append('image', selectedImage);

        try {
            const response = await fetch('http://localhost:8001/api/upload-and-learn', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to analyze image');

            const data: AnalysisResult = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Analysis error:', error);
            toast.error('Failed to analyze question. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-background bg-gradient-mesh noise flex flex-col relative overflow-hidden">
            {/* Background orbs */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="orb orb-primary w-[80vw] h-[80vh] opacity-30 top-[-20%] left-[-20%]" />
                <div className="orb orb-accent w-[60vw] h-[60vh] opacity-20 bottom-[-10%] right-[-10%]" />
            </div>

            <Navbar onProfileClick={() => { }} />

            <main className="flex-1 w-full max-w-5xl mx-auto px-6 mt-28 mb-12 flex flex-col relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="glass"
                                size="icon"
                                onClick={() => navigate('/')}
                                className="rounded-xl hover:bg-white/10 w-10 h-10"
                            >
                                <ArrowLeft className="w-4 h-4 text-foreground" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                                    <GraduationCap className="w-7 h-7 text-primary" />
                                    <Translate>Upload & Learn</Translate>
                                    <span className="hidden sm:inline-block text-primary px-3 py-1 bg-primary/10 rounded-lg text-[10px] font-black border border-primary/20 tracking-widest">NCERT AI</span>
                                </h1>
                                <p className="text-xs text-muted-foreground font-medium mt-0.5"><Translate>Factual solutions for Class 1-12 NCERT.</Translate></p>
                            </div>
                        </div>
                        {result && (
                            <Button
                                variant="glass"
                                size="sm"
                                onClick={handleReset}
                                className="rounded-lg gap-1.5 hover:bg-white/10 text-xs px-3 h-9"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <Translate>Reset</Translate>
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                        {/* Left: Upload area */}
                        <div className="lg:col-span-5 flex flex-col gap-4">
                            <motion.div
                                whileHover={{ scale: 1.002 }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => !result && fileInputRef.current?.click()}
                                className={`relative aspect-[4/3] rounded-2xl border transition-all overflow-hidden flex flex-col items-center justify-center gap-3 group ${previewUrl ? 'border-primary/30 bg-primary/5' : 'border-white/5 bg-white/5 hover:border-white/10'
                                    } ${result ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                                        {!result && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <p className="text-white text-xs font-bold">Swap Image</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Camera className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-foreground">Click or Drop Photo</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG (Max 10MB)</p>
                                        </div>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </motion.div>

                            {!result && (
                                <Button
                                    onClick={handleAnalyze}
                                    disabled={!selectedImage || isAnalyzing}
                                    className="w-full h-11 rounded-xl text-xs font-bold shadow-soft group relative overflow-hidden"
                                >
                                    {isAnalyzing ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                                    ) : (
                                        <Sparkles className="w-3.5 h-3.5 mr-2 group-hover:rotate-12 transition-transform" />
                                    )}
                                    <span className="relative z-10">
                                        {isAnalyzing ? <Translate>Analyzing...</Translate> : <Translate>Analyze Question</Translate>}
                                    </span>
                                </Button>
                            )}
                        </div>

                        {/* Right: Results Area */}
                        <div className="lg:col-span-7 h-full">
                            <AnimatePresence mode="wait">
                                {result ? (
                                    <motion.div
                                        key="result"
                                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl"
                                    >
                                        {/* Status Header */}
                                        <div className={`px-5 py-4 flex items-center justify-between border-b border-white/10 ${result.is_ncert ? 'bg-green-500/5' : 'bg-amber-500/5'}`}>
                                            <div className="flex items-center gap-2.5">
                                                <div className={`p-1.5 rounded-lg ${result.is_ncert ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                    {result.is_ncert ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className={`text-[8px] font-black uppercase tracking-widest ${result.is_ncert ? 'text-green-400' : 'text-amber-400'}`}>
                                                        {result.is_ncert ? 'Authenticated' : 'Moderated'}
                                                    </p>
                                                    <h3 className="text-sm font-black text-foreground">
                                                        {result.is_ncert ? 'Syllabus Aligned' : 'Off-Curriculum'}
                                                    </h3>
                                                </div>
                                            </div>
                                            {result.is_ncert && (
                                                <Button
                                                    variant="glass"
                                                    size="sm"
                                                    onClick={handleDownloadPDF}
                                                    className="rounded-lg gap-1.5 text-primary text-[10px] h-8 font-bold"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    SAVE PDF
                                                </Button>
                                            )}
                                        </div>

                                        {/* Content Scroll Area */}
                                        <div className="p-6 space-y-6 max-h-[550px] overflow-y-auto custom-scrollbar flex-1">
                                            {/* OCR Source */}
                                            <div className="space-y-1.5">
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Question Detected</p>
                                                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 italic text-foreground/80 text-xs leading-relaxed font-medium">
                                                    "{result.extracted_question}"
                                                </div>
                                            </div>

                                            {result.is_ncert ? (
                                                <>
                                                    {/* Subject & Class Badges */}
                                                    <div className="flex flex-wrap gap-3">
                                                        <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 flex flex-col min-w-[80px]">
                                                            <span className="text-[8px] font-bold text-primary uppercase opacity-70 tracking-tight">Subject</span>
                                                            <span className="text-xs font-black text-foreground uppercase">{result.subject}</span>
                                                        </div>
                                                        <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 flex flex-col min-w-[80px]">
                                                            <span className="text-[8px] font-bold text-primary uppercase opacity-70 tracking-tight">Class</span>
                                                            <span className="text-xs font-black text-foreground uppercase">Grade {result.grade}</span>
                                                        </div>
                                                        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex flex-col max-w-[200px]">
                                                            <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-70 tracking-tight">Topic</span>
                                                            <span className="text-xs font-bold text-foreground truncate">{result.chapter}</span>
                                                        </div>
                                                    </div>

                                                    {/* The Answer */}
                                                    <div className="space-y-3 pt-2">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Academic Solution</p>
                                                            <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
                                                        </div>
                                                        <div className="text-xs md:text-sm text-foreground/90 leading-relaxed prose prose-invert prose-sm max-w-none font-medium
                                                                prose-headings:text-primary prose-headings:font-black prose-headings:tracking-tight prose-headings:mt-4 prose-headings:mb-2
                                                                prose-p:mb-3 prose-strong:text-primary prose-strong:font-black
                                                                prose-ul:list-disc prose-ul:pl-4 prose-li:mb-1
                                                                prose-code:bg-white/10 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                                                            <ReactMarkdown
                                                                remarkPlugins={[remarkMath]}
                                                                rehypePlugins={[rehypeKatex]}
                                                            >
                                                                {result.answer || ''}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-center py-12 px-6 space-y-3 opacity-90">
                                                    <AlertCircle className="w-12 h-12 text-amber-500/40" />
                                                    <div className="space-y-1.5">
                                                        <h4 className="text-lg font-black text-foreground">Out of Syllabus</h4>
                                                        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                                                            {result.message || "This content doesn't seem to match the NCERT curriculum."}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ) : isAnalyzing ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-full bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center min-h-[400px]"
                                    >
                                        <div className="relative mb-5">
                                            <div className="w-16 h-16 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                                            <Sparkles className="w-5 h-5 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                        </div>
                                        <h3 className="text-lg font-black text-foreground">AI Reasoning</h3>
                                        <p className="text-[11px] text-muted-foreground mt-1.5 max-w-[240px] mx-auto leading-normal">Comparing extracted text with official NCERT database and validation rules.</p>

                                        <div className="mt-6 flex gap-1.5">
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-1.5 h-1.5 rounded-full bg-primary"
                                                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                                                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-full bg-white/5 border border-white/5 border-dashed border rounded-2xl flex flex-col items-center justify-center p-8 text-center opacity-40 min-h-[400px]">
                                        <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
                                            <FileText className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Awaiting Input</h4>
                                        <p className="text-[11px] text-muted-foreground mt-1.5 max-w-[200px]">Upload a photo to see the AI analysis here.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </main>

            <Penman
                activeTaskId={result ? "result" : isAnalyzing ? "analyzing" : "upload"}
                completedTasks={result ? ["upload", "analyzing"] : isAnalyzing ? ["upload"] : []}
                messages={{
                    "upload": { instruction: "Hi! I am Penman. Upload a photo of any NCERT question, and I'll generate a perfect exam-style solution for you!" },
                    "analyzing": { instruction: "I'm currently processing your image and searching for this topic in the NCERT curriculum. Just a moment!" },
                    "result": {
                        instruction: result?.is_ncert
                            ? `I've found the solution! This maps to Class ${result.grade} ${result.subject}. You can even download this as a PDF.`
                            : "I've checked the textbooks, but this question seems to be outside the NCERT syllabus range I cover."
                    }
                }}
            />
        </div>
    );
};

export default UploadAndLearn;
