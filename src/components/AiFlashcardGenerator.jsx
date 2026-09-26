import React, { useState, useRef } from "react";
import {
  FiCpu,
  FiFileText,
  FiX,
  FiAlertCircle,
  FiZap,
  FiLoader,
} from "react-icons/fi";
import { GoogleGenerativeAI } from "@google/generative-ai";

const AiFlashcardGenerator = ({ onGenerate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [deckTitle, setDeckTitle] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setError("");
    } else {
      setError("Please upload a valid PDF document.");
    }
  };

  const handleGenerate = async () => {
    if (!deckTitle.trim())
      return setError("Please enter a title for your flashcard deck.");
    if (!pdfFile) return setError("Please attach a PDF document.");

    let apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) apiKey = apiKey.replace(/['"]/g, "").trim();

    if (!apiKey || apiKey === "undefined") {
      return setError(
        "Missing API Key. Please add VITE_GEMINI_API_KEY to your .env file.",
      );
    }

    setIsGenerating(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(pdfFile);

      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(",")[1];
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: "gemini-flash-lite-latest",
            generationConfig: { responseMimeType: "application/json" },
          });

          // STRICT PROMPT FOR FLASHCARDS (MULTIPLE CHOICE ONLY)
          const prompt = `You are an expert tutor. Generate EXACTLY ${numQuestions} multiple choice flashcards based ONLY on the attached PDF document. Focus on key concepts, terms, and definitions.
          
          Return ONLY a valid JSON array of objects. Use this EXACT structure:
          [
            {
              "question": "Sample question text?",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": 0
            }
          ]
          Make sure correctAnswer is an integer (0-3) representing the index of the correct option.`;

          const pdfPart = {
            inlineData: { data: base64Data, mimeType: "application/pdf" },
          };

          const result = await model.generateContent([prompt, pdfPart]);
          const responseText = result.response.text();
          const generatedCards = JSON.parse(responseText);

          // Force formatting check
          const formattedCards = generatedCards.map((c) => ({
            question: c.question,
            options: c.options || [],
            correctAnswer: parseInt(c.correctAnswer, 10) || 0,
          }));

          onGenerate(deckTitle, formattedCards);

          // Reset state on success
          setIsOpen(false);
          setPdfFile(null);
          setDeckTitle("");
          setNumQuestions(5);
        } catch (apiError) {
          console.error("SDK Error:", apiError);
          setError(`API Error: ${apiError.message}`);
        } finally {
          setIsGenerating(false);
        }
      };

      reader.onerror = () => {
        setError("Failed to read the PDF file locally.");
        setIsGenerating(false);
      };
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-transform hover:-translate-y-0.5 shadow-md shrink-0"
      >
        <FiZap className="text-xl" /> Create Deck from PDF
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-[#003B46]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden border border-[#006064]/10 animate-fade-in-up">
            <div className="bg-[#F8FDFD] p-6 border-b border-[#006064]/10 flex items-center justify-between shrink-0">
              <div>
                <p className="text-xs font-black text-[#00838F] uppercase tracking-widest mb-1">
                  AI Assistant
                </p>
                <h2 className="text-2xl font-black text-[#003B46] flex items-center gap-2 tracking-tight">
                  <FiCpu className="text-[#26C6DA]" /> PDF Flashcard Generator
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-gray-50 text-gray-400 hover:text-[#003B46] rounded-xl transition-colors border border-gray-100 hover:bg-gray-100"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 md:p-8 space-y-8 flex-1 bg-white">
              <div>
                <label className="block text-xs font-bold text-[#00838F] uppercase tracking-widest mb-3">
                  1. Deck Title
                </label>
                <input
                  type="text"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  placeholder="e.g., Module 4: Network Security"
                  className="w-full bg-[#F8FDFD] border border-[#006064]/10 rounded-xl px-4 py-3 text-sm font-bold text-[#003B46] focus:outline-none focus:border-[#26C6DA] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00838F] uppercase tracking-widest mb-3">
                  2. Upload PDF Lesson
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${pdfFile ? "border-green-300 bg-green-50" : "border-[#006064]/20 bg-[#F8FDFD] hover:bg-[#E0F7FA]/30"}`}
                >
                  <FiFileText
                    className={`text-4xl mb-3 ${pdfFile ? "text-green-500" : "text-[#00838F]"}`}
                  />
                  <p className="font-bold text-[#003B46] text-center">
                    {pdfFile ? pdfFile.name : "Click to browse for a PDF"}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00838F] uppercase tracking-widest mb-3">
                  3. Number of Flashcards
                </label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full bg-[#F8FDFD] border border-[#006064]/10 rounded-xl px-4 py-3 text-sm font-bold text-[#003B46] focus:outline-none focus:border-[#26C6DA] cursor-pointer"
                >
                  <option value={5}>5 Cards (Quick Review)</option>
                  <option value={10}>10 Cards (Standard)</option>
                  <option value={20}>20 Cards (Deep Dive)</option>
                </select>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-bold">
                  <FiAlertCircle className="text-xl shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{error}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[#006064]/10 bg-[#F8FDFD] flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-[#006064] bg-white border border-[#006064]/10 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-3 rounded-xl text-sm font-black tracking-widest uppercase shadow-md flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <FiLoader className="animate-spin text-lg" />
                ) : (
                  <FiZap className="text-lg" />
                )}
                {isGenerating ? "Analyzing..." : "Generate Flashcards"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiFlashcardGenerator;
