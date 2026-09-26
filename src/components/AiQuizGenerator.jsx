import React, { useState, useRef } from "react";
import {
  FiCpu,
  FiFileText,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import { GoogleGenerativeAI } from "@google/generative-ai";

const AiQuizGenerator = ({ onGenerate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);

  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("Medium");

  const [types, setTypes] = useState({
    mcq: true,
    true_false: true,
    multiple_response: false,
    identification: false,
  });

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

  const handleToggleType = (type) => {
    setTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleGenerate = async () => {
    if (!pdfFile) return setError("Please attach a PDF document.");

    const activeTypes = Object.keys(types).filter((k) => types[k]);
    if (activeTypes.length === 0)
      return setError("Select at least one question type.");

    let apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (apiKey) {
      apiKey = apiKey.replace(/['"]/g, "").trim();
    }

    if (!apiKey || apiKey === "undefined") {
      return setError(
        "Missing API Key. Please add VITE_GEMINI_API_KEY to your .env file and restart your terminal.",
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

          const prompt = `You are an expert educator. Generate EXACTLY ${numQuestions} questions based ONLY on the attached PDF document.
          Difficulty level: ${difficulty}.
          Allowed question types: ${activeTypes.join(", ")}.
          
          Return ONLY a valid JSON array of objects. Use this EXACT structure based on the question type:
          
          [
            {
              "type": "mcq",
              "text": "Sample MCQ question?",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": 0, 
              "points": 1
            },
            {
              "type": "multiple_response",
              "text": "Sample Multiple Response?",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": [0, 2],
              "points": 1
            },
            {
              "type": "true_false",
              "text": "Sample True or False statement.",
              "options": ["True", "False"],
              "correctAnswer": "True", 
              "points": 1
            },
            {
              "type": "identification",
              "text": "Sample identification question?",
              "options": [],
              "correctAnswer": "The exact text answer",
              "points": 1
            }
          ]`;

          const pdfPart = {
            inlineData: {
              data: base64Data,
              mimeType: "application/pdf",
            },
          };

          const result = await model.generateContent([prompt, pdfPart]);
          const responseText = result.response.text();

          const generatedQuestions = JSON.parse(responseText);

          const formattedQuestions = generatedQuestions.map((q, idx) => {
            let fixedAnswer = q.correctAnswer;
            let fixedOptions = q.options || [];

            if (q.type === "true_false") {
              fixedOptions = ["True", "False"];
              if (fixedAnswer === 0 || fixedAnswer === "0")
                fixedAnswer = "True";
              if (fixedAnswer === 1 || fixedAnswer === "1")
                fixedAnswer = "False";
            }

            if (
              q.type === "identification" &&
              typeof fixedAnswer === "number"
            ) {
              fixedAnswer = String(fixedAnswer);
            }

            return {
              ...q,
              options: fixedOptions,
              correctAnswer: fixedAnswer,
              id: Date.now() + idx,
            };
          });

          onGenerate(formattedQuestions);
          setIsOpen(false);
          setPdfFile(null);
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
        className="w-full border-2 border-dashed border-[#006064]/20 bg-white rounded-2xl py-8 flex flex-col items-center justify-center gap-3 text-[#00838F] hover:bg-[#F8FDFD] hover:border-[#26C6DA]/50 transition-all duration-300 shadow-sm"
      >
        <div className="bg-[#E0F7FA]/50 p-3 rounded-xl border border-[#006064]/5">
          <FiCpu className="text-3xl" />
        </div>
        <span className="font-bold tracking-widest uppercase text-sm">
          Auto-Generate via AI
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-[#003B46]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden border border-[#006064]/10">
            <div className="bg-[#F8FDFD] p-6 border-b border-[#006064]/10 flex items-center justify-between shrink-0">
              <div>
                <p className="text-xs font-black text-[#00838F] uppercase tracking-widest mb-1">
                  AI Assistant
                </p>
                <h2 className="text-2xl font-black text-[#003B46] flex items-center gap-2 tracking-tight">
                  <FiCpu className="text-[#26C6DA]" /> PDF to Quiz Generator
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-gray-50 text-gray-400 hover:text-[#003B46] rounded-xl transition-colors border border-gray-100 hover:bg-gray-100"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 md:p-8 space-y-8 flex-1">
              <div>
                <label className="block text-xs font-bold text-[#00838F] uppercase tracking-widest mb-3">
                  1. Upload Material
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
                  <p className="text-xs font-medium text-[#006064]/60 mt-1">
                    Syllabus, articles, or lecture slides
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#00838F] uppercase tracking-widest mb-3">
                    2. Volume
                  </label>
                  <select
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-full bg-[#F8FDFD] border border-[#006064]/10 rounded-xl px-4 py-3 text-sm font-bold text-[#003B46] focus:outline-none focus:border-[#26C6DA] cursor-pointer"
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#00838F] uppercase tracking-widest mb-3">
                    3. Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-[#F8FDFD] border border-[#006064]/10 rounded-xl px-4 py-3 text-sm font-bold text-[#003B46] focus:outline-none focus:border-[#26C6DA] cursor-pointer"
                  >
                    <option value="Easy">Easy (Recall & Facts)</option>
                    <option value="Medium">Medium (Application)</option>
                    <option value="Hard">Hard (Analysis & Critical)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00838F] uppercase tracking-widest mb-3">
                  4. Allowable Formats
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "mcq", label: "Multiple Choice" },
                    { id: "true_false", label: "True / False" },
                    { id: "multiple_response", label: "Multiple Answer" },
                    { id: "identification", label: "Identification" },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleToggleType(type.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 font-bold text-sm transition-all ${types[type.id] ? "border-[#00838F] bg-[#E0F7FA]/30 text-[#00838F]" : "border-[#006064]/10 bg-white text-[#006064]/50 hover:bg-gray-50"}`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${types[type.id] ? "bg-[#00838F] text-white border-[#00838F]" : "border-[#006064]/20"}`}
                      >
                        {types[type.id] && <FiCheck className="text-sm" />}
                      </div>
                      {type.label}
                    </button>
                  ))}
                </div>
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
                  <FiCpu className="text-lg" />
                )}
                {isGenerating ? "Analyzing..." : "Generate Quiz"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiQuizGenerator;
