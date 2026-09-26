import React, { useState, useEffect } from "react";
import {
  FiZap,
  FiArrowRight,
  FiCheckCircle,
  FiXCircle,
  FiBookOpen,
  FiTrash2,
  FiRefreshCw,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../config/supabase";
import { Toast } from "./ui/Toast";
import { ConfirmModal } from "./ui/ConfirmModal";
import AiFlashcardGenerator from "./AiFlashcardGenerator";

export const PracticeArena = () => {
  const { userData } = useAuth();
  const [toast, setToast] = useState({ message: "", type: "" });
  const showToast = (message, type = "info") => setToast({ message, type });

  const [currentView, setCurrentView] = useState("list");
  const [decks, setDecks] = useState([]);
  const [activeDeck, setActiveDeck] = useState(null);

  const [cardIndex, setCardIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Custom Confirmation Modal State
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    id: null,
  });

  // 1. THE HYBRID FETCH LOGIC
  useEffect(() => {
    const loadDecks = async () => {
      if (!userData?.id) return;
      const cacheKey = `flashcards_${userData.id}`;
      const cachedDecks = localStorage.getItem(cacheKey);

      if (cachedDecks && cachedDecks !== "[]") {
        setDecks(JSON.parse(cachedDecks));
      } else {
        await fetchFromDatabase(cacheKey);
      }
    };
    loadDecks();
  }, [userData?.id]);

  // 2. DATABASE FETCH FUNCTION
  const fetchFromDatabase = async (cacheKey) => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from("flashcard_decks")
        .select("*")
        .eq("student_id", userData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedDecks = data.map((d) => ({
        id: d.id,
        title: d.title,
        date: new Date(d.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        cards: d.cards,
      }));

      setDecks(formattedDecks);
      localStorage.setItem(
        cacheKey || `flashcards_${userData.id}`,
        JSON.stringify(formattedDecks),
      );
    } catch (error) {
      console.error("Error fetching decks:", error);
      showToast("Failed to sync with database.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. CREATE & SAVE TO BOTH
  const handleNewDeckGenerated = async (title, generatedCards) => {
    try {
      const { data, error } = await supabase
        .from("flashcard_decks")
        .insert([
          { student_id: userData.id, title: title, cards: generatedCards },
        ])
        .select()
        .single();

      if (error) throw error;

      const newDeck = {
        id: data.id,
        title: data.title,
        date: new Date(data.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        cards: data.cards,
      };

      const updatedDecks = [newDeck, ...decks];
      setDecks(updatedDecks);
      localStorage.setItem(
        `flashcards_${userData.id}`,
        JSON.stringify(updatedDecks),
      );

      showToast(`Successfully created "${title}"`, "success");
    } catch (error) {
      console.error("Save error:", error);
      showToast("Failed to save deck to database.", "error");
    }
  };

  // 4. DELETE FROM BOTH (Updated to use custom modal)
  const initiateDelete = (id) => setConfirmDelete({ isOpen: true, id });

  const executeDelete = async () => {
    const id = confirmDelete.id;
    try {
      const { error } = await supabase
        .from("flashcard_decks")
        .delete()
        .eq("id", id)
        .eq("student_id", userData.id);

      if (error) throw error;

      const updatedDecks = decks.filter((d) => d.id !== id);
      setDecks(updatedDecks);
      localStorage.setItem(
        `flashcards_${userData.id}`,
        JSON.stringify(updatedDecks),
      );
      showToast("Deck successfully deleted.", "success");
    } catch (error) {
      console.error("Delete error:", error);
      showToast("Failed to delete deck.", "error");
    } finally {
      setConfirmDelete({ isOpen: false, id: null });
    }
  };

  // Player Logic
  const startReview = (deck) => {
    setActiveDeck(deck);
    setCardIndex(0);
    setSelectedOption(null);
    setCurrentView("play");
  };

  const nextCard = () => {
    if (cardIndex < activeDeck.cards.length - 1) {
      setCardIndex(cardIndex + 1);
      setSelectedOption(null);
    } else {
      setCurrentView("list");
      setActiveDeck(null);
      showToast("Deck review complete! Great job.", "success");
    }
  };

  return (
    <div className="pt-20 md:pt-10 px-6 lg:px-10 pb-24 min-h-screen bg-[#F8FDFD] text-[#003B46] flex flex-col font-sans max-w-7xl mx-auto relative selection:bg-[#26C6DA] selection:text-[#003B46]">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "" })}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Delete Flashcard Deck"
        message="Are you sure you want to delete this study deck? You will not be able to recover it."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />

      {/* VIEW: DECK LIST */}
      {currentView === "list" && (
        <div className="animate-fade-in-up mt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl md:text-4xl font-black text-[#003B46] tracking-tight">
                  Practice Arena
                </h1>
                <button
                  onClick={() => fetchFromDatabase()}
                  disabled={isSyncing}
                  className="p-2 text-[#006064]/40 hover:text-[#00838F] bg-white border border-[#006064]/10 rounded-full transition-all shadow-sm hover:shadow-md"
                  title="Force Sync with Database"
                >
                  <FiRefreshCw className={isSyncing ? "animate-spin" : ""} />
                </button>
              </div>
              <p className="text-sm font-medium text-[#006064]/70">
                Your personal AI-generated flashcard library.
              </p>
            </div>

            <AiFlashcardGenerator onGenerate={handleNewDeckGenerated} />
          </div>

          {decks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#006064]/10 p-16 text-center shadow-sm max-w-2xl mx-auto mt-12">
              <FiBookOpen className="text-5xl text-[#00838F]/30 mx-auto mb-4" />
              <h2 className="text-xl font-black text-[#003B46] mb-2">
                Your Arena is Empty
              </h2>
              <p className="text-[#006064]/60 font-medium leading-relaxed text-sm">
                Upload your lesson PDFs and let the AI generate custom flashcard
                decks to help you review at your own pace.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="bg-white p-6 rounded-2xl border border-[#006064]/10 shadow-sm hover:shadow-md hover:border-[#26C6DA]/50 transition-all group flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#E0F7FA] text-[#00838F] flex items-center justify-center shrink-0">
                      <FiZap className="text-xl" />
                    </div>
                    <button
                      onClick={() => initiateDelete(deck.id)}
                      className="text-[#006064]/30 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                    >
                      <FiTrash2 className="text-lg" />
                    </button>
                  </div>
                  <h3 className="text-lg font-black text-[#003B46] mb-1 leading-tight">
                    {deck.title}
                  </h3>
                  <p className="text-xs font-bold text-[#006064]/50 mb-6">
                    {deck.cards.length} Cards • Created {deck.date}
                  </p>

                  <button
                    onClick={() => startReview(deck)}
                    className="mt-auto w-full bg-white border border-[#006064]/10 hover:bg-[#F8FDFD] hover:border-[#00838F] hover:text-[#00838F] text-[#006064] py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    Review Deck <FiArrowRight />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: FLASHCARD PLAYER */}
      {currentView === "play" && activeDeck && (
        <div className="max-w-3xl mx-auto w-full animate-fade-in-up mt-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentView("list")}
              className="flex items-center gap-2 text-[#006064]/60 hover:text-[#00838F] font-bold text-sm tracking-widest uppercase transition-colors"
            >
              <FiXCircle className="text-xl" /> Exit Review
            </button>
            <span className="bg-white border border-[#006064]/10 text-[#00838F] px-4 py-1.5 rounded-lg font-black text-xs tracking-widest shadow-sm">
              CARD {cardIndex + 1} OF {activeDeck.cards.length}
            </span>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#006064]/10 shadow-sm">
            <h2 className="text-xl md:text-2xl font-black text-[#003B46] mb-8 leading-snug">
              {activeDeck.cards[cardIndex].question}
            </h2>

            <div className="space-y-3">
              {activeDeck.cards[cardIndex].options.map((opt, i) => {
                const isCorrect =
                  i === activeDeck.cards[cardIndex].correctAnswer;
                const isSelected = selectedOption === i;

                let btnStyle =
                  "bg-white border-[#006064]/10 text-[#003B46] hover:border-[#26C6DA]/50 hover:bg-[#F8FDFD]";

                if (selectedOption !== null) {
                  if (isCorrect) {
                    btnStyle =
                      "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm";
                  } else if (isSelected && !isCorrect) {
                    btnStyle = "bg-red-50 border-red-400 text-red-800";
                  } else {
                    btnStyle =
                      "bg-gray-50 border-gray-200 text-gray-400 opacity-50";
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() =>
                      selectedOption === null && setSelectedOption(i)
                    }
                    disabled={selectedOption !== null}
                    className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm font-bold transition-all duration-300 flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {selectedOption !== null && isCorrect && (
                      <FiCheckCircle className="text-emerald-500 text-xl shrink-0" />
                    )}
                    {selectedOption !== null && isSelected && !isCorrect && (
                      <FiXCircle className="text-red-500 text-xl shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedOption !== null && (
              <div className="mt-8 flex justify-end animate-fade-in-up">
                <button
                  onClick={nextCard}
                  className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-colors shadow-md hover:-translate-y-0.5"
                >
                  {cardIndex < activeDeck.cards.length - 1
                    ? "Next Card"
                    : "Finish Review"}{" "}
                  <FiArrowRight className="text-base" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
