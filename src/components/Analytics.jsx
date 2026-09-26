import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiTarget,
  FiUsers,
  FiAlertCircle,
  FiDownload,
  FiChevronRight,
  FiX,
  FiCheckCircle,
  FiSearch,
  FiClock,
  FiArrowLeft,
  FiBarChart2,
  FiAward,
} from "react-icons/fi";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";
import { Toast } from "./ui/Toast";

// Chart.js Setup
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const translateAnswer = (rawAnswer, questionData) => {
  if (rawAnswer === null || rawAnswer === undefined || rawAnswer === "")
    return "No Answer Provided";

  try {
    const qType = questionData.question_type;
    const options = questionData.options_data || [];

    if (qType === "mcq") {
      const idx = parseInt(rawAnswer, 10);
      return options[idx] || "Unknown Option";
    }

    if (qType === "multiple_response") {
      const parsedArr =
        typeof rawAnswer === "string" ? JSON.parse(rawAnswer) : rawAnswer;
      if (Array.isArray(parsedArr)) {
        return parsedArr
          .map((idx) => options[idx])
          .filter(Boolean)
          .join("  •  ");
      }
    }

    return String(rawAnswer).replace(/"/g, "");
  } catch (e) {
    return String(rawAnswer).replace(/"/g, "");
  }
};

export const Analytics = () => {
  const { userData } = useAuth();
  const [toast, setToast] = useState({ message: "", type: "" });
  const showToast = (message, type = "info") => setToast({ message, type });

  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    maxScore: 0,
    highestAchieved: 0,
    passRate: 0,
  });

  const [gradeData, setGradeData] = useState(null);
  const [distractorData, setDistractorData] = useState(null);

  const [roster, setRoster] = useState([]);
  const [itemAnalysis, setItemAnalysis] = useState([]);
  const [selectedStudentResult, setSelectedStudentResult] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [visibleRows, setVisibleRows] = useState(10);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select("*")
          .eq("instructor_id", userData.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setQuizzes(data || []);

        if (data && data.length > 0) {
          handleSelectQuiz(data[0].id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        showToast("Failed to load assessments.", "error");
        setLoading(false);
      }
    };

    if (userData?.id) fetchQuizzes();
  }, [userData?.id]);

  const handleSelectQuiz = async (quizId) => {
    setLoading(true);
    setSelectedQuiz(quizId);
    setSearchTerm("");
    setVisibleRows(10);

    try {
      const { data: questions, error: qError } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_index", { ascending: true });

      if (qError) throw qError;
      const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

      const { data: attempts, error: aError } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", quizId)
        .eq("status", "completed");

      if (aError) throw aError;

      if (!attempts || attempts.length === 0) {
        setStats({
          totalAttempts: 0,
          averageScore: 0,
          maxScore,
          highestAchieved: 0,
          passRate: 0,
        });
        setGradeData(null);
        setDistractorData(null);
        setRoster([]);
        setItemAnalysis([]);
        setLoading(false);
        return;
      }

      const attemptIds = attempts.map((a) => a.id);
      const { data: answers, error: ansError } = await supabase
        .from("student_answers")
        .select("*, questions(*)")
        .in("attempt_id", attemptIds);

      if (ansError) throw ansError;

      let totalClassScore = 0;
      let highestScore = 0;
      const buckets = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      let passedCount = 0;

      attempts.forEach((attempt) => {
        totalClassScore += attempt.score;
        if (attempt.score > highestScore) highestScore = attempt.score;

        const percentage = maxScore > 0 ? (attempt.score / maxScore) * 100 : 0;
        if (percentage >= 60) passedCount++;

        if (percentage >= 90) buckets.A++;
        else if (percentage >= 80) buckets.B++;
        else if (percentage >= 70) buckets.C++;
        else if (percentage >= 60) buckets.D++;
        else buckets.F++;
      });

      setStats({
        totalAttempts: attempts.length,
        averageScore: Math.round(
          (totalClassScore / (attempts.length * maxScore)) * 100,
        ),
        maxScore,
        highestAchieved: Math.round((highestScore / maxScore) * 100),
        passRate: Math.round((passedCount / attempts.length) * 100),
      });

      setGradeData({
        labels: [
          "A (90-100%)",
          "B (80-89%)",
          "C (70-79%)",
          "D (60-69%)",
          "F (<60%)",
        ],
        datasets: [
          {
            label: "Students",
            data: [buckets.A, buckets.B, buckets.C, buckets.D, buckets.F],
            backgroundColor: [
              "#00838F",
              "#26C6DA",
              "#80DEEA",
              "#F59E0B",
              "#EF4444",
            ],
            borderRadius: 6,
            barPercentage: 0.7,
          },
        ],
      });

      const processedRoster = attempts.map((attempt) => {
        const percentage =
          maxScore > 0 ? Math.round((attempt.score / maxScore) * 100) : 0;
        const studentSpecificAnswers = answers.filter(
          (a) => a.attempt_id === attempt.id,
        );
        const rawName =
          attempt.student_name ||
          `Student-${attempt.student_id.substring(0, 4).toUpperCase()}`;

        return {
          id: attempt.id,
          studentName: rawName,
          score: attempt.score,
          percentage,
          date: new Date(attempt.completed_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          answers: studentSpecificAnswers,
        };
      });

      processedRoster.sort((a, b) =>
        a.studentName.localeCompare(b.studentName),
      );
      setRoster(processedRoster);

      const itemStats = questions.map((q) => {
        const qAnswers = answers.filter((a) => a.question_id === q.id);
        const total = qAnswers.length;
        const passed = qAnswers.filter((a) => a.is_correct).length;
        const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
        return {
          ...q,
          total,
          passed,
          failed: total - passed,
          passRate,
          qAnswers,
        };
      });
      setItemAnalysis(itemStats);

      const mcqStats = itemStats.filter((q) => q.question_type === "mcq");
      let mostMissed = null;
      let highestFailRate = 0;

      mcqStats.forEach((stat) => {
        const failRate = stat.total > 0 ? stat.failed / stat.total : 0;
        if (failRate > highestFailRate && stat.total > 0) {
          highestFailRate = failRate;
          mostMissed = stat;
        }
      });

      if (mostMissed && highestFailRate > 0) {
        const choices = {};
        mostMissed.qAnswers.forEach((ans) => {
          const given = parseInt(ans.given_answer, 10);
          choices[given] = (choices[given] || 0) + 1;
        });

        const labels = mostMissed.options_data.map((opt, i) =>
          i === mostMissed.correct_answer ? `${opt} (Key)` : opt,
        );
        const data = mostMissed.options_data.map((_, i) => choices[i] || 0);
        const bgColors = mostMissed.options_data.map((_, i) =>
          i === mostMissed.correct_answer
            ? "#10B981"
            : choices[i] >= mostMissed.total / 3
              ? "#EF4444"
              : "#E2E8F0",
        );

        setDistractorData({
          questionText: mostMissed.content,
          failRate: Math.round(highestFailRate * 100),
          chart: {
            labels,
            datasets: [
              {
                label: "Selections",
                data,
                backgroundColor: bgColors,
                borderRadius: 4,
              },
            ],
          },
        });
      } else {
        setDistractorData(null);
      }
    } catch (error) {
      console.error("Analytics Error:", error);
      showToast("Error processing analytics.", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student Name,Score,Max Score,Percentage,Date Completed\n";
    roster.forEach((r) => {
      csvContent += `"${r.studentName}",${r.score},${stats.maxScore},${r.percentage}%,"${r.date}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Class_Analytics_Export_${selectedQuiz}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("Gradebook exported to CSV!", "success");
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#006064", font: { weight: "bold" } },
      },
      y: {
        grid: { color: "#00606410" },
        beginAtZero: true,
        ticks: { stepSize: 1, color: "#00606480" },
      },
    },
  };

  const filteredRoster = roster.filter((student) =>
    student.studentName.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const displayedRoster = filteredRoster.slice(0, visibleRows);

  return (
    <div className="pt-20 md:pt-10 px-6 lg:px-10 pb-24 min-h-screen bg-[#F8FDFD] text-[#003B46] flex flex-col font-sans max-w-7xl mx-auto relative selection:bg-[#26C6DA] selection:text-[#003B46]">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "" })}
      />

      {/* Header & Controls */}
      <div className="mb-8 mt-4 border-b border-[#006064]/10 pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-[#006064]/60 hover:text-[#00838F] font-bold text-sm uppercase tracking-widest mb-4 transition-colors"
          >
            <FiArrowLeft /> Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-[#003B46] tracking-tight">
            Class Analytics
          </h1>
          <p className="mt-2 text-sm font-medium text-[#006064]/70">
            Analyze performance trends and manage grades.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="bg-white border border-[#006064]/10 text-[#006064] text-sm font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow-sm w-full sm:w-auto shrink-0">
            <FiClock className="text-[#00838F]" />
            {new Date().toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
          <select
            value={selectedQuiz || ""}
            onChange={(e) => handleSelectQuiz(e.target.value)}
            className="w-full sm:w-64 bg-white border border-[#006064]/20 rounded-xl px-4 py-3 text-sm font-bold text-[#003B46] focus:outline-none focus:border-[#00838F] shadow-sm cursor-pointer"
          >
            {quizzes.length === 0 && (
              <option value="">No quizzes deployed yet</option>
            )}
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} ({q.quiz_code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-white/50 rounded-2xl border border-[#006064]/5"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-80 bg-white/50 rounded-2xl border border-[#006064]/5"></div>
          </div>
        </div>
      ) : roster.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#006064]/10 shadow-sm mt-4">
          <FiActivity className="text-6xl text-[#00838F]/20 mx-auto mb-4" />
          <h3 className="text-2xl font-black text-[#003B46] mb-2">
            Insufficient Data
          </h3>
          <p className="text-[#006064]/60 font-medium">
            No students have completed this assessment yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6 mt-4">
          {/* 4-Block Metric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Attempts",
                value: stats.totalAttempts,
                icon: <FiUsers />,
                trend: "Completed",
              },
              {
                label: "Class Average",
                value: `${stats.averageScore}%`,
                icon: <FiTarget />,
                trend: "Mean Score",
              },
              {
                label: "Highest Score",
                value: `${stats.highestAchieved}%`,
                icon: <FiAward />,
                trend: "Top Performer",
              },
              {
                label: "Pass Rate",
                value: `${stats.passRate}%`,
                icon: <FiCheckCircle />,
                trend: "Scored 60%+",
              },
            ].map((metric, i) => (
              <div
                key={i}
                className="bg-white border border-[#006064]/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-[#26C6DA]/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold text-[#006064]/60 flex items-center gap-2 tracking-widest uppercase">
                    <span className="text-[#00838F] text-lg">
                      {metric.icon}
                    </span>{" "}
                    {metric.label}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-black text-[#003B46]">
                    {metric.value}
                  </span>
                  <span className="text-xs font-medium text-[#00838F] bg-[#E0F7FA] px-2 py-1 rounded-md">
                    {metric.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#006064]/10 shadow-sm flex flex-col">
              <h3 className="text-sm font-black text-[#00838F] uppercase tracking-widest mb-6">
                The Grade Curve
              </h3>
              <div className="flex-1 min-h-[250px] w-full relative">
                <Bar data={gradeData} options={chartOptions} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#006064]/10 shadow-sm flex flex-col relative overflow-hidden">
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div>
                  <h3 className="text-sm font-black text-[#00838F] uppercase tracking-widest flex items-center gap-2 mb-1">
                    <FiAlertCircle className="text-red-500" /> Distractor Trap
                  </h3>
                  <p className="text-xs font-bold text-[#006064]/50">
                    Most missed multiple-choice question
                  </p>
                </div>
                {distractorData && (
                  <span className="bg-red-50 text-red-600 border border-red-100 font-bold text-xs px-2.5 py-1 rounded-md uppercase tracking-wider">
                    {distractorData.failRate}% Failed
                  </span>
                )}
              </div>
              {distractorData ? (
                <div className="flex-1 flex flex-col">
                  <p className="font-bold text-[#003B46] mb-6 line-clamp-2">
                    "{distractorData.questionText}"
                  </p>
                  <div className="flex-1 min-h-[180px] w-full relative z-10">
                    <Bar
                      data={distractorData.chart}
                      options={{ ...chartOptions, indexAxis: "y" }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#006064]/40 font-bold text-sm bg-[#F8FDFD] rounded-xl border border-dashed border-[#006064]/10 mt-4">
                  No traps identified.
                </div>
              )}
            </div>
          </div>

          {/* Item Analysis Table */}
          <div className="bg-white rounded-2xl border border-[#006064]/10 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#006064]/10 bg-white">
              <h3 className="text-sm font-black text-[#00838F] uppercase tracking-widest">
                Item Analysis
              </h3>
            </div>
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#F8FDFD] shadow-sm z-10 border-b border-[#006064]/10">
                  <tr className="text-[#00838F] text-xs uppercase tracking-widest">
                    <th className="px-6 py-4 font-black">Q#</th>
                    <th className="px-6 py-4 font-black">Question Content</th>
                    <th className="px-6 py-4 font-black">Type</th>
                    <th className="px-6 py-4 font-black">Pass Rate</th>
                  </tr>
                </thead>
                <tbody className="text-[#003B46] font-medium text-sm">
                  {itemAnalysis.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#006064]/5 hover:bg-[#F8FDFD] transition-colors last:border-0"
                    >
                      <td className="px-6 py-4 font-bold text-[#26C6DA]">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4 max-w-md truncate">
                        {item.content}
                      </td>
                      <td className="px-6 py-4 uppercase text-[10px] font-black tracking-wider text-[#006064]/50">
                        {item.question_type.replace("_", " ")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-black ${item.passRate < 60 ? "text-red-500" : "text-emerald-500"}`}
                          >
                            {item.passRate}%
                          </span>
                          <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={`h-full ${item.passRate < 60 ? "bg-red-400" : "bg-emerald-400"}`}
                              style={{ width: `${item.passRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gradebook Table */}
          <div className="bg-white rounded-2xl border border-[#006064]/10 shadow-sm overflow-hidden mt-6">
            <div className="p-6 border-b border-[#006064]/10 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-[#00838F] uppercase tracking-widest">
                  Real-Time Gradebook
                </h3>
                <p className="text-xs font-bold text-[#006064]/50 mt-1">
                  Click a row to view detailed answers.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-auto">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006064]/40" />
                  <input
                    type="text"
                    placeholder="Search roster..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm border border-[#006064]/20 rounded-xl focus:outline-none focus:border-[#00838F] text-[#003B46] font-medium bg-[#F8FDFD]"
                  />
                </div>
                <button
                  onClick={exportToCSV}
                  className="bg-white border border-[#006064]/20 hover:bg-[#F8FDFD] hover:border-[#00838F] text-[#006064] hover:text-[#00838F] px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-colors shrink-0"
                >
                  <FiDownload className="text-base" /> Export
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F8FDFD] border-b border-[#006064]/10">
                  <tr className="text-[#00838F] text-xs uppercase tracking-widest">
                    <th className="px-6 py-4 font-black">Student Name</th>
                    <th className="px-6 py-4 font-black">Date Completed</th>
                    <th className="px-6 py-4 font-black">Score</th>
                    <th className="px-6 py-4 font-black">Grade</th>
                    <th className="px-6 py-4 font-black text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="text-[#003B46] font-medium text-sm">
                  {displayedRoster.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedStudentResult(student)}
                      className="border-b border-[#006064]/5 hover:bg-[#F8FDFD] cursor-pointer transition-colors last:border-0 group"
                    >
                      <td className="px-6 py-4 font-bold">
                        {student.studentName}
                      </td>
                      <td className="px-6 py-4 text-[#006064]/60">
                        {student.date}
                      </td>
                      <td className="px-6 py-4 font-black text-[#00838F]">
                        {student.score} / {stats.maxScore}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-black tracking-wider ${student.percentage >= 60 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}
                        >
                          {student.percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-[#006064]/30 group-hover:text-[#00838F] transition-colors">
                        <FiChevronRight className="text-xl inline-block" />
                      </td>
                    </tr>
                  ))}
                  {displayedRoster.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-12 text-center text-[#006064]/50 font-bold"
                      >
                        No students found matching "{searchTerm}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {visibleRows < filteredRoster.length && (
              <div className="p-4 flex justify-center border-t border-[#006064]/5 bg-[#F8FDFD]">
                <button
                  onClick={() => setVisibleRows((prev) => prev + 10)}
                  className="px-6 py-2 rounded-xl text-xs font-bold tracking-widest uppercase text-[#00838F] hover:bg-[#E0F7FA] transition-colors"
                >
                  Load More Students
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STUDENT RESULT MODAL */}
      {selectedStudentResult && (
        <div className="fixed inset-0 z-[100] bg-[#003B46]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden border border-[#006064]/10">
            <div className="bg-[#F8FDFD] p-6 border-b border-[#006064]/10 flex items-center justify-between shrink-0">
              <div>
                <p className="text-xs font-black text-[#00838F] uppercase tracking-widest mb-1">
                  Student Results
                </p>
                <h2 className="text-2xl font-black text-[#003B46] tracking-tight">
                  {selectedStudentResult.studentName}
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right mr-4 hidden sm:block">
                  <p className="text-[10px] font-black text-[#006064]/50 uppercase tracking-widest">
                    Score
                  </p>
                  <p className="font-black text-[#00838F] text-xl">
                    {selectedStudentResult.score} / {stats.maxScore}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudentResult(null)}
                  className="p-2 bg-gray-50 text-gray-400 hover:text-[#003B46] rounded-xl transition-colors border border-gray-100 hover:bg-gray-100"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 flex-1 bg-white">
              {itemAnalysis.map((question, idx) => {
                const studentAns = selectedStudentResult.answers.find(
                  (a) => a.question_id === question.id,
                );
                const isCorrect = studentAns?.is_correct;

                return (
                  <div
                    key={question.id}
                    className={`p-5 rounded-2xl border ${isCorrect ? "border-emerald-100 bg-emerald-50/30" : "border-red-100 bg-red-50/30"}`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="mt-0.5 shrink-0">
                        {isCorrect ? (
                          <FiCheckCircle className="text-emerald-500 text-lg" />
                        ) : (
                          <FiAlertCircle className="text-red-500 text-lg" />
                        )}
                      </div>
                      <p className="text-sm font-bold text-[#003B46] leading-relaxed">
                        <span className="text-[#00838F] mr-1">Q{idx + 1}.</span>{" "}
                        {question.content}
                      </p>
                    </div>

                    <div className="ml-8 grid sm:grid-cols-2 gap-3 text-sm font-medium">
                      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black text-[#006064]/40 uppercase tracking-widest mb-1.5">
                          Student Answer
                        </p>
                        <p
                          className={`font-bold ${isCorrect ? "text-emerald-700" : "text-red-600"}`}
                        >
                          {translateAnswer(studentAns?.given_answer, question)}
                        </p>
                      </div>
                      <div className="bg-[#F8FDFD] p-3.5 rounded-xl border border-[#006064]/5">
                        <p className="text-[10px] font-black text-[#006064]/40 uppercase tracking-widest mb-1.5">
                          Correct Answer
                        </p>
                        <p className="font-bold text-[#00838F]">
                          {translateAnswer(question.correct_answer, question)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
