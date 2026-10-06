import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiUser,
  FiActivity,
  FiTarget,
  FiCheckCircle,
  FiAlertCircle,
  FiBarChart2
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../config/supabase";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Line, Bar, Scatter } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const StudentAnalyticsProfile = () => {
  const { classId, studentId } = useParams();
  const { userData } = useAuth();
  
  const [studentData, setStudentData] = useState(null);
  const [classData, setClassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Analytics Data
  const [timelineData, setTimelineData] = useState(null);
  const [consistencyStats, setConsistencyStats] = useState(null);
  const [pacingData, setPacingData] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [overallStats, setOverallStats] = useState({
    average: 0,
    totalCompleted: 0,
    strengths: [],
    weaknesses: []
  });

  useEffect(() => {
    if (!userData?.id || !classId || !studentId) return;

    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Student Profile
        const { data: sData } = await supabase
          .from("user_profiles")
          .select("full_name")
          .eq("id", studentId)
          .single();
        if (sData) setStudentData(sData);

        // 2. Fetch Class Details
        const { data: cData } = await supabase
          .from("classes")
          .select("name")
          .eq("id", classId)
          .single();
        if (cData) setClassData(cData);

        // 3. Fetch Quizzes for this class
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select("id, title, difficulty, created_at")
          .eq("class_id", classId)
          .order("created_at", { ascending: true });

        if (!quizzes || quizzes.length === 0) {
          setIsLoading(false);
          return;
        }

        // 4. Fetch Student's Attempts
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select(`
            *,
            student_answers (
              is_correct, points_awarded,
              questions (question_type, points)
            )
          `)
          .eq("student_id", studentId)
          .eq("status", "completed")
          .in("quiz_id", quizzes.map((q) => q.id))
          .order("completed_at", { ascending: true });

        if (!attempts || attempts.length === 0) {
          setIsLoading(false);
          return;
        }

        // 5. Fetch ALL attempts for class to calculate Benchmarks
        const { data: allClassAttempts } = await supabase
          .from("quiz_attempts")
          .select("quiz_id, score")
          .eq("status", "completed")
          .in("quiz_id", quizzes.map((q) => q.id));

        // --- PROCESS DATA ---
        
        let totalScore = 0;
        let totalMax = 0;

        // Timeline array
        const labels = [];
        const scores = [];
        const pacingPoints = [];
        const quizMaxMap = {}; // Maps quiz_id -> max_score

        // We map each attempt to its corresponding quiz
        attempts.forEach((attempt) => {
          const quiz = quizzes.find((q) => q.id === attempt.quiz_id);


          let attemptMax = 0;
          
          attempt.student_answers.forEach((ans) => {
            const qPoints = ans.questions.points || 1;
            attemptMax += qPoints;
          });

          quizMaxMap[attempt.quiz_id] = attemptMax;
          totalScore += attempt.score;
          totalMax += attemptMax;

          // For Timeline & Pacing
          if (attemptMax > 0) {
            const scorePct = Math.round((attempt.score / attemptMax) * 100);
            labels.push(quiz?.title || "Unknown");
            scores.push(scorePct);

            // Calculate pacing (minutes spent)
            const started = new Date(attempt.created_at);
            const finished = new Date(attempt.completed_at);
            const minutes = Math.max(0.5, (finished - started) / (1000 * 60)); // Minimum 30s
            
            pacingPoints.push({
              x: Number(minutes.toFixed(1)),
              y: scorePct
            });
          }
        });

        // Calculate Overall
        const overallAvg = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

        // Process Benchmark Data
        const classAverages = [];
        labels.forEach((quizTitle, idx) => {
          const attempt = attempts[idx];
          const quizId = attempt.quiz_id;
          const max = quizMaxMap[quizId];
          
          if (!max) {
            classAverages.push(0);
            return;
          }

          const classScores = (allClassAttempts || [])
            .filter(a => a.quiz_id === quizId)
            .map(a => Math.round((a.score / max) * 100));
            
          if (classScores.length > 0) {
            const avg = classScores.reduce((a, b) => a + b, 0) / classScores.length;
            classAverages.push(Math.round(avg));
          } else {
            classAverages.push(0);
          }
        });



        // Process Consistency (Standard Deviation)
        let consistency = { sd: 0, label: "No Data", color: "text-gray-400", desc: "Take more quizzes to measure consistency." };
        if (scores.length > 1) {
          const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
          const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
          const sd = Math.sqrt(variance);
          
          if (sd <= 10) {
            consistency = { sd: Math.round(sd), label: "Highly Consistent", color: "text-emerald-500", desc: "Predictable, stable performance." };
          } else if (sd <= 20) {
            consistency = { sd: Math.round(sd), label: "Moderate Fluctuation", color: "text-amber-500", desc: "Some variance between assessments." };
          } else {
            consistency = { sd: Math.round(sd), label: "Erratic", color: "text-red-500", desc: "Wild swings in performance." };
          }
        } else if (scores.length === 1) {
          consistency = { sd: 0, label: "Needs More Data", color: "text-[#00838F]", desc: "Take another quiz to measure consistency." };
        }

        // Set State
        setOverallStats({
          average: overallAvg,
          totalCompleted: attempts.length,
          strengths: [],
          weaknesses: []
        });

        setTimelineData({
          labels,
          datasets: [
            {
              label: "Score (%)",
              data: scores,
              borderColor: "#00838F",
              backgroundColor: "rgba(0, 131, 143, 0.1)",
              fill: true,
              tension: 0.4,
              pointBackgroundColor: "#003B46",
            }
          ]
        });

        setConsistencyStats(consistency);

        setPacingData({
          datasets: [
            {
              label: "Student Attempts",
              data: pacingPoints,
              backgroundColor: "#26C6DA",
              borderColor: "#00838F",
              borderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8
            }
          ]
        });

        setBenchmarkData({
          labels,
          datasets: [
            {
              label: "Student Score",
              data: scores,
              backgroundColor: "#00838F",
              borderRadius: 6
            },
            {
              label: "Class Average",
              data: classAverages,
              backgroundColor: "#E0F7FA",
              borderColor: "#B2EBF2",
              borderWidth: 1,
              borderRadius: 6
            }
          ]
        });

      } catch (error) {
        console.error("Error loading analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [userData?.id, classId, studentId]);

  if (isLoading) {
    return (
      <div className="pt-20 md:pt-10 px-6 lg:px-10 pb-24 min-h-screen bg-[#F8FDFD] flex items-center justify-center">
        <div className="text-[#00838F] font-black uppercase tracking-widest animate-pulse flex items-center gap-3">
          <FiBarChart2 className="text-2xl" /> Loading Deep Analytics...
        </div>
      </div>
    );
  }

  if (!timelineData) {
    return (
      <div className="pt-20 md:pt-10 px-6 lg:px-10 pb-24 min-h-screen bg-[#F8FDFD] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-black text-[#003B46] mb-4">No Data Available</h2>
        <p className="text-[#006064]/60 mb-6 font-medium">This student has not completed any assessments in this class.</p>
        <Link to={`/dashboard/classes/${classId}`} className="text-[#00838F] font-bold uppercase tracking-widest flex items-center gap-2">
          <FiArrowLeft /> Return to Class Roster
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-10 px-6 lg:px-10 pb-24 min-h-screen bg-[#F8FDFD] text-[#003B46] flex flex-col font-sans max-w-7xl mx-auto relative selection:bg-[#26C6DA] selection:text-[#003B46]">
      {/* Header */}
      <div className="mb-10 mt-4 animate-fade-in-up">
        <Link
          to={`/dashboard/classes/${classId}`}
          className="inline-flex items-center gap-2 text-[#006064]/60 hover:text-[#00838F] font-bold text-xs uppercase tracking-widest transition-colors mb-6"
        >
          <FiArrowLeft className="text-lg" /> Back to Roster
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-black text-[#00838F] uppercase tracking-widest mb-1 flex items-center gap-2">
              <FiUser /> Student Analytics Profile
            </p>
            <h1 className="text-3xl md:text-5xl font-black text-[#003B46] tracking-tight mb-2">
              {studentData?.full_name || "Unknown Student"}
            </h1>
            <p className="text-sm md:text-base font-medium text-[#006064]/70 flex items-center gap-2">
              {classData?.name || "Unknown Class"}
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-[#006064]/10 text-center">
              <p className="text-[10px] font-black text-[#006064]/50 uppercase tracking-widest mb-1">
                Completed
              </p>
              <span className="text-2xl font-black text-[#003B46]">
                {overallStats.totalCompleted}
              </span>
            </div>
            <div className="bg-white px-8 py-4 rounded-2xl shadow-md text-center border-t-4 border-[#00838F]">
              <p className="text-[10px] font-black text-[#006064]/50 uppercase tracking-widest mb-1">
                Overall Average
              </p>
              <div className="flex items-end justify-center gap-1">
                <span className={`text-4xl font-black ${overallStats.average >= 75 ? "text-emerald-500" : overallStats.average < 60 ? "text-red-500" : "text-amber-500"}`}>
                  {overallStats.average}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Insights Banner */}
      {(overallStats.weaknesses.length > 0 || overallStats.strengths.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6 mb-10 animate-fade-in-up animation-delay-100">
          {overallStats.weaknesses.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-4">
              <div className="bg-red-100 p-3 rounded-xl shrink-0">
                <FiAlertCircle className="text-red-600 text-xl" />
              </div>
              <div>
                <h3 className="font-black text-red-900 text-lg mb-1">Areas for Improvement</h3>
                <p className="text-sm font-medium text-red-800/80 leading-relaxed">
                  This student consistently struggles with <span className="font-bold text-red-900">{overallStats.weaknesses.join(" and ")}</span> formats. Consider providing targeted practice in these areas.
                </p>
              </div>
            </div>
          )}
          
          {overallStats.strengths.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-start gap-4">
              <div className="bg-emerald-100 p-3 rounded-xl shrink-0">
                <FiCheckCircle className="text-emerald-600 text-xl" />
              </div>
              <div>
                <h3 className="font-black text-emerald-900 text-lg mb-1">Demonstrated Strengths</h3>
                <p className="text-sm font-medium text-emerald-800/80 leading-relaxed">
                  This student excels in <span className="font-bold text-emerald-900">{overallStats.strengths.join(" and ")}</span> formats. They have a strong foundational understanding here.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-3 gap-6 animate-fade-in-up animation-delay-200 mb-6">
        
        {/* Timeline Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#006064]/10 shadow-sm relative overflow-hidden flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-black text-[#003B46] tracking-wide flex items-center gap-2">
              <FiActivity className="text-[#00838F]" /> Performance Trajectory
            </h3>
            <p className="text-xs font-medium text-[#006064]/60 mt-1">Scores over chronological assessment attempts.</p>
          </div>
          <div className="flex-1 relative min-h-[300px] w-full min-w-0">
            <Line 
              data={timelineData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { min: 0, max: 100, grid: { color: "rgba(0,0,0,0.05)" } },
                  x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
        </div>

        {/* Consistency Tracker */}
        <div className="bg-white p-6 rounded-3xl border border-[#006064]/10 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-black text-[#003B46] tracking-wide flex items-center gap-2">
              <FiTarget className="text-[#00838F]" /> Score Consistency
            </h3>
            <p className="text-xs font-medium text-[#006064]/60 mt-1">Measures performance deviation.</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            <div className="relative flex items-center justify-center mb-4">
              <svg className="w-32 h-16" viewBox="0 0 100 50">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#E0F7FA" strokeWidth="12" strokeLinecap="round" />
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" className={consistencyStats?.color || "text-gray-300"} strokeDasharray={`${Math.max(0, 100 - (consistencyStats?.sd || 0) * 2)} 1000`} />
              </svg>
              <div className="absolute bottom-0 text-3xl font-black text-[#003B46]">
                ±{consistencyStats?.sd || 0}
              </div>
            </div>
            <h4 className={`text-xl font-black ${consistencyStats?.color || "text-gray-400"}`}>
              {consistencyStats?.label}
            </h4>
            <p className="text-sm font-bold text-[#006064]/50 mt-2 text-center max-w-[200px]">
              {consistencyStats?.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Pacing Analytics */}
      <div className="bg-white p-6 md:p-10 rounded-3xl border border-[#006064]/10 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-10 mb-6">
        <div className="w-full md:w-1/3 text-center md:text-left">
          <h3 className="text-xl font-black text-[#003B46] tracking-wide mb-2">
            Pacing Analytics
          </h3>
          <p className="text-sm font-medium text-[#006064]/70 leading-relaxed mb-6">
            This chart plots the student's score against the time they spent taking the assessment. It identifies if poor performance is due to rushing, or struggling over a long period.
          </p>
        </div>
        
        <div className="w-full md:flex-1 relative min-h-[300px] min-w-0">
            <Scatter 
              data={pacingData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { 
                    min: 0, max: 100, 
                    title: { display: true, text: 'Score (%)', color: '#003B46', font: { weight: 'bold' } } 
                  },
                  x: { 
                    title: { display: true, text: 'Time Spent (Minutes)', color: '#003B46', font: { weight: 'bold' } },
                    grid: { display: false }
                  }
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (ctx) => `Time: ${ctx.raw.x}m, Score: ${ctx.raw.y}%`
                    }
                  }
                }
              }} 
            />
          </div>
      </div>

      {/* Class Benchmark */}
      <div className="bg-white p-6 md:p-10 rounded-3xl border border-[#006064]/10 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-10 mb-6">
        <div className="w-full md:w-1/3 text-center md:text-left">
          <h3 className="text-xl font-black text-[#003B46] tracking-wide mb-2">
            Class Benchmark
          </h3>
          <p className="text-sm font-medium text-[#006064]/70 leading-relaxed mb-6">
            Compares the student's score directly against the average score of all other students who completed the same assessment.
          </p>
        </div>
        
        <div className="w-full md:flex-1 relative min-h-[300px] min-w-0">
            <Bar 
              data={benchmarkData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { min: 0, max: 100 },
                  x: { grid: { display: false } }
                },
                plugins: {
                  legend: { position: "top" }
                }
              }} 
            />
          </div>
      </div>

    </div>
  );
};
