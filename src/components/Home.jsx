import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiBarChart2,
  FiUsers,
  FiBookOpen,
  FiTrendingUp,
  FiAnchor,
  FiArrowRight,
  FiZap,
  FiTarget,
  FiMenu,
  FiX,
  FiPlus,
  FiMinus,
  FiKey,
  FiCompass,
} from "react-icons/fi";

const Home = () => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");

  // --- Scroll State ---
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const isProgrammaticScroll = useRef(false);

  // --- Mobile Menu State ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- FAQ Accordion State ---
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // --- Refs for smooth scrolling ---
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const processRef = useRef(null);
  const analyticsRef = useRef(null);
  const faqRef = useRef(null);
  const footerRef = useRef(null); // <-- FIXED: Added this back!

  const scrollToSection = (ref) => {
    isProgrammaticScroll.current = true;
    mobileMenuOpen && setMobileMenuOpen(false);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 800);
  };

  // --- Scroll Listeners ---
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;

      if (!isProgrammaticScroll.current) {
        if (scrollY > lastScrollY.current && scrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }
      lastScrollY.current = scrollY;
      setScrolled(scrollY > 80);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen]);

  // --- Parallax Logic ---
  const [parallaxOffset, setParallaxOffset] = useState(0);
  useEffect(() => {
    const handleParallax = () => setParallaxOffset(window.scrollY);
    window.addEventListener("scroll", handleParallax);
    return () => window.removeEventListener("scroll", handleParallax);
  }, []);

  const getParallax = (speed = 0.05, offset = 0) =>
    parallaxOffset * speed + offset;

  // --- Nav items ---
  const navItems = ["Features", "Process", "Analytics", "FAQ"];
  const navRefs = [featuresRef, processRef, analyticsRef, faqRef];

  // --- Submit Handler ---
  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (joinCode.trim()) {
      // Route the guest to the assessment verification page
      navigate(`/guest/${joinCode.trim().toUpperCase()}`);
    }
  };

  // --- FAQ Data ---
  const faqData = [
    {
      question: "Do students need an account to take a quiz?",
      answer:
        "No! DEPTH supports frictionless guest access. Instructors simply share a 6-digit access code, and students can join instantly from any device by just entering their name.",
    },
    {
      question: "What is the Practice Arena?",
      answer:
        "The Practice Arena is a dedicated space where students can upload their own PDFs or study materials. Our AI instantly processes the text and generates custom multiple-choice flashcard decks for personal review.",
    },
    {
      question: "Can I upload my own PDFs to generate quizzes?",
      answer:
        "Absolutely. Instructors can upload lesson materials in PDF format, and the system will process the content to suggest quiz questions, distractor options, and correct answers.",
    },
    {
      question: "What kind of analytics does DEPTH provide?",
      answer:
        "DEPTH goes beyond final scores. We identify 'Distractor Traps' (the wrong answers students pick most often), provide per-question pass rates, and deliver real-time gradebook exports.",
    },
  ];

  return (
    <div className="relative overflow-x-hidden font-sans antialiased text-white">
      {/* ======================== SEAMLESS GLOBAL BACKGROUND ======================== */}
      <div
        className="absolute inset-0 z-[-3] pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, #E0F7FA 0%, #4DD0E1 15%, #00838F 30%, #0D1B2A 60%, #050A12 100%)",
        }}
      />

      {/* ======================== DEEP OCEAN TRENCH SILHOUETTES ======================== */}
      <div className="absolute top-[25%] bottom-0 left-0 w-[15vw] md:w-[20vw] z-[-2] pointer-events-none opacity-80 mix-blend-multiply">
        <svg
          viewBox="0 0 100 1000"
          preserveAspectRatio="none"
          className="w-full h-full drop-shadow-2xl"
          fill="#02050A"
        >
          <path d="M0,0 C30,40 10,80 40,120 C60,160 20,200 45,240 C75,290 30,340 55,390 C85,450 40,510 65,570 C95,640 45,710 70,780 C100,850 50,920 75,1000 L0,1000 Z" />
        </svg>
      </div>
      <div className="absolute top-[20%] bottom-0 right-0 w-[15vw] md:w-[22vw] z-[-2] pointer-events-none opacity-80 mix-blend-multiply">
        <svg
          viewBox="0 0 100 1000"
          preserveAspectRatio="none"
          className="w-full h-full drop-shadow-2xl"
          fill="#02050A"
        >
          <path d="M100,0 C70,40 90,80 60,120 C40,160 80,200 55,240 C25,290 70,340 45,390 C15,450 60,510 35,570 C5,640 55,710 30,780 C0,850 50,920 25,1000 L100,1000 Z" />
        </svg>
      </div>

      {/* ======================== DRIFTING BUBBLES ======================== */}
      <div className="absolute top-[20%] bottom-[10%] left-0 w-full pointer-events-none z-[-1] overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-white/20 bg-white/5 animate-bubble-rise"
            style={{
              left: `${Math.random() * 90 + 5}%`,
              width: `${Math.random() * 12 + 4}px`,
              height: `${Math.random() * 12 + 4}px`,
              animationDuration: `${Math.random() * 15 + 10}s`,
              animationDelay: `${Math.random() * -20}s`,
            }}
          />
        ))}
      </div>

      {/* ======================== NAVBAR ======================== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ease-out ${isVisible ? "translate-y-0" : "-translate-y-full"
          } ${scrolled
            ? "bg-[#050A12]/90 backdrop-blur-2xl shadow-2xl border-b border-white/5"
            : "bg-white/80 backdrop-blur-md shadow-sm"
          }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => scrollToSection(heroRef)}
          >
            <FiAnchor
              className={`text-2xl group-hover:rotate-12 transition-transform duration-300 ${scrolled ? "text-[#64FFDA]" : "text-[#006064]"}`}
            />
            <span
              className={`text-2xl font-black tracking-widest transition-colors duration-300 ${scrolled ? "text-[#FFF4E6]" : "text-[#006064]"}`}
            >
              DEPTH
            </span>
          </div>

          <ul className="hidden lg:flex items-center gap-8 text-sm font-bold uppercase tracking-wider">
            {navItems.map((item, idx) => (
              <li key={idx}>
                <button
                  onClick={() => scrollToSection(navRefs[idx])}
                  className={`transition-all duration-300 relative group ${scrolled ? "text-[#E0F7FA]/90 hover:text-[#64FFDA]" : "text-[#006064]/80 hover:text-[#00838F]"}`}
                >
                  {item}
                  <span
                    className={`absolute -bottom-1 left-0 w-0 h-[2px] transition-all duration-300 group-hover:w-full ${scrolled ? "bg-[#64FFDA]" : "bg-[#00838F]"}`}
                  />
                </button>
              </li>
            ))}
          </ul>

          <div className="hidden lg:flex items-center gap-6">
            <Link
              to="/login"
              className={`text-sm font-bold tracking-wide transition-colors duration-300 ${scrolled ? "text-[#FFF4E6] hover:text-[#64FFDA]" : "text-[#006064] hover:text-[#00838F]"}`}
            >
              Login
            </Link>
            <Link
              to="/signup"
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 text-sm font-bold tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${scrolled ? "bg-[#64FFDA] text-[#050A12]" : "bg-[#006064] text-white hover:bg-[#00838F]"}`}
            >
              Sign Up Free <FiArrowRight />
            </Link>
          </div>

          <button
            className="lg:hidden text-2xl"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <FiX className={scrolled ? "text-[#FFF4E6]" : "text-[#006064]"} />
            ) : (
              <FiMenu
                className={scrolled ? "text-[#FFF4E6]" : "text-[#006064]"}
              />
            )}
          </button>
        </nav>

        <div
          className={`lg:hidden transition-all duration-300 overflow-hidden ${mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"} ${scrolled ? "bg-[#050A12]/95 backdrop-blur-2xl border-b border-white/10" : "bg-white shadow-lg border-b border-[#006064]/10"}`}
        >
          <div className="px-4 py-6 flex flex-col items-center gap-4">
            {navItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => scrollToSection(navRefs[idx])}
                className={`w-full text-center py-3 text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${scrolled ? "text-[#E0F7FA]/90 hover:text-[#64FFDA]" : "text-[#006064]/90 hover:text-[#00838F]"}`}
              >
                {item}
              </button>
            ))}
            <div className="w-full h-px bg-current opacity-10 my-2" />
            <Link
              to="/login"
              className={`w-full text-center py-3 text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${scrolled ? "text-[#FFF4E6] hover:text-[#64FFDA]" : "text-[#006064] hover:text-[#00838F]"}`}
            >
              Instructor Login
            </Link>
            <Link
              to="/signup"
              className={`w-full text-center py-3 rounded-full transition-all duration-300 text-sm font-bold tracking-wide ${scrolled ? "bg-[#64FFDA] text-[#050A12]" : "bg-[#006064] text-white"}`}
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      {/* ======================== HERO — The Surface ======================== */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center pt-28 pb-32"
        style={{ minHeight: "100vh" }}
      >
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#FFF4E6]/20 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg
            className="absolute top-[10%] left-[-5%] w-[300px] md:w-[400px] opacity-[0.4] animate-cloud-1 drop-shadow-md"
            viewBox="0 0 200 100"
            fill="white"
          >
            <path d="M30,70 Q10,50 30,35 Q40,15 65,20 Q80,5 105,15 Q125,5 145,25 Q165,20 170,45 Q185,55 175,75 Q185,90 165,95 L30,95 Q10,90 30,70 Z" />
          </svg>
          <svg
            className="absolute top-[20%] right-[-5%] w-[250px] md:w-[350px] opacity-[0.5] animate-cloud-2 drop-shadow-md"
            viewBox="0 0 200 100"
            fill="white"
          >
            <path d="M20,60 Q5,40 20,25 Q30,10 55,15 Q70,0 95,10 Q115,0 135,20 Q155,15 160,40 Q175,50 165,70 Q175,85 155,90 L20,90 Q5,85 20,60 Z" />
          </svg>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-[55%] pointer-events-none">
          <div
            className="absolute bottom-0 w-full overflow-hidden"
            style={{ transform: `translateY(${getParallax(0.06)}px)` }}
          >
            <svg
              className="w-full h-auto animate-wave-slow opacity-90"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              style={{ minWidth: "200%", height: "200px" }}
            >
              <defs>
                <linearGradient
                  id="waveGrad1"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#26C6DA" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#00838F" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <path
                d="M0,160 C360,240 480,80 720,140 C960,200 1080,240 1440,160 L1440,320 L0,320 Z"
                fill="url(#waveGrad1)"
              />
            </svg>
          </div>
          <div
            className="absolute bottom-0 w-full overflow-hidden"
            style={{ transform: `translateY(${getParallax(0.1)}px)` }}
          >
            <svg
              className="w-full h-auto animate-wave-medium opacity-95"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              style={{ minWidth: "200%", height: "220px" }}
            >
              <defs>
                <linearGradient
                  id="waveGrad2"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#4DD0E1" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#26C6DA" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#0097A7" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <path
                d="M0,200 C240,120 480,280 720,200 C960,120 1200,280 1440,200 L1440,320 L0,320 Z"
                fill="url(#waveGrad2)"
              />
            </svg>
          </div>
          <div
            className="absolute bottom-0 w-full overflow-hidden"
            style={{ transform: `translateY(${getParallax(0.15)}px)` }}
          >
            <svg
              className="w-full h-auto animate-wave-fast"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              style={{ minWidth: "200%", height: "240px" }}
            >
              <defs>
                <linearGradient
                  id="waveGrad3"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#80DEEA" stopOpacity="1" />
                  <stop offset="30%" stopColor="#4DD0E1" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#26C6DA" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <path
                d="M0,240 C200,160 400,300 600,240 C800,180 1000,300 1200,240 C1300,210 1400,260 1440,220 L1440,320 L0,320 Z"
                fill="url(#waveGrad3)"
              />
            </svg>
          </div>
        </div>

        {/* Hero Content */}
        <div
          className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 text-center pb-12"
          style={{ transform: `translateY(${getParallax(-0.02)}px)` }}
        >
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight text-[#006064] drop-shadow-[0_10px_20px_rgba(0,96,100,0.15)] animate-float">
            DEPTH
          </h1>
          <p className="mt-2 text-xl md:text-3xl lg:text-4xl font-extrabold text-[#00838F] tracking-wider">
            Your score is only the surface.
          </p>
          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg font-medium text-[#006064]/90 leading-relaxed">
            Frictionless assessments with zero account required for students.
            Generate AI quizzes, uncover distractor traps, and empower learning
            through interactive flashcards.
          </p>

          {/* Quick Join Input Box */}
          <form
            onSubmit={handleJoinSubmit}
            className="mt-10 max-w-md mx-auto relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-[#26C6DA] to-[#00838F] rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center">
              <FiKey className="absolute left-6 text-2xl text-[#00838F]" />
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ENTER ACCESS CODE"
                className="w-full bg-white/90 backdrop-blur-md border-2 border-white rounded-full pl-16 pr-16 py-5 text-xl font-black text-[#003B46] placeholder-[#006064]/40 focus:outline-none focus:border-[#26C6DA] shadow-xl uppercase tracking-widest transition-all"
                maxLength={8}
                required
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#00838F] text-white rounded-full flex items-center justify-center hover:bg-[#006064]   shadow-[0_0_15px_rgba(0,131,143,0.4)]"
              >
                <FiArrowRight className="text-2xl" />
              </button>
            </div>
          </form>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => scrollToSection(featuresRef)}
              className="px-6 py-3 rounded-full bg-white/40 border border-[#006064]/20 text-[#006064] hover:bg-white/70 transition-all duration-300 font-bold flex items-center gap-2"
            >
              <FiChevronDown /> Explore Features
            </button>
            <Link
              to="/instructor-signup"
              className="px-6 py-3 rounded-full bg-transparent text-[#006064] hover:text-[#00838F] transition-all duration-300 font-bold flex items-center gap-2"
            >
              Instructor Signup <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ======================== FEATURES — The Shallows ======================== */}
      <section
        ref={featuresRef}
        className="relative min-h-screen flex items-center py-48 px-6 lg:px-8 bg-transparent"
      >
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-[#FFF4E6] tracking-tight drop-shadow-md">
              What's Under the Surface?
            </h2>
            <p className="mt-3 text-xl text-[#64FFDA] font-semibold tracking-wider">
              Tools designed for deep learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FiBookOpen />,
                title: "Smarter Creation",
                forWho: "For Instructors",
                desc: "Upload PDFs and let AI generate multiple-choice, true/false, or identification questions in seconds.",
                color: "#64FFDA",
                speed: 0.02,
              },
              {
                icon: <FiZap />,
                title: "Practice Arena",
                forWho: "For Students",
                desc: "Upload your own study materials to generate interactive AI flashcard decks for personal review.",
                color: "#FFD54F",
                speed: 0.04,
              },
              {
                icon: <FiTrendingUp />,
                title: "Deep Analytics",
                forWho: "For Instructors",
                desc: "Identify distractor traps and class-wide misconceptions instantly with real-time breakdowns.",
                color: "#64FFDA",
                speed: 0.06,
              },
              {
                icon: <FiTarget />,
                title: "Frictionless Access",
                forWho: "For Everyone",
                desc: "No student accounts required. Share a simple access code and let participants join from any device.",
                color: "#FFD54F",
                speed: 0.08,
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative bg-[#0D1B2A]/40 backdrop-blur-md rounded-2xl p-8 border border-white/10 border-l-4 hover:border-l-[#64FFDA] transition-all duration-700 shadow-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:-translate-y-2"
                style={{
                  borderLeftColor: feature.color + "90",
                  transform: `translateY(${getParallax(feature.speed, idx * 5)}px)`,
                }}
              >
                <div
                  className="text-4xl mb-5 transition-transform duration-300 group-hover:scale-110 drop-shadow-lg"
                  style={{ color: feature.color }}
                >
                  {feature.icon}
                </div>
                <span className="inline-block text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/10 mb-4 shadow-sm text-white">
                  {feature.forWho}
                </span>
                <h3 className="text-xl font-bold text-[#FFF4E6] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[#E0F7FA]/90 leading-relaxed text-sm font-medium">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== HOW IT WORKS — The Mid-Water ======================== */}
      <section
        ref={processRef}
        className="relative min-h-screen flex items-center py-48 px-6 lg:px-8 bg-transparent"
      >
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-[#FFF4E6] tracking-tight drop-shadow-md">
              Your Journey in 4 Steps
            </h2>
            <p className="mt-3 text-xl text-[#64FFDA] font-semibold tracking-wider">
              From quiz creation to meaningful insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-[#64FFDA]/10 via-[#64FFDA]/50 to-[#64FFDA]/10" />

            {[
              {
                step: "01",
                title: "Create Assessment",
                desc: "Instructors set up quizzes with custom questions or use AI suggestions from uploaded PDFs.",
                forWho: "Instructor",
                speed: 0.02,
              },
              {
                step: "02",
                title: "Join Instantly",
                desc: "Students enter a secure access code on the homepage and provide their name to begin.",
                forWho: "Student",
                speed: 0.04,
              },
              {
                step: "03",
                title: "Secure Testing",
                desc: "Students answer questions in a distraction-free, securely monitored fullscreen interface.",
                forWho: "Student",
                speed: 0.06,
              },
              {
                step: "04",
                title: "Analyze & Export",
                desc: "Instructors review distractor traps, class averages, and export the gradebook directly to CSV.",
                forWho: "Instructor",
                speed: 0.08,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="relative z-10 bg-[#050A12]/50 backdrop-blur-xl rounded-2xl p-8 border border-white/5 hover:border-[#64FFDA]/40 transition-all duration-500 hover:scale-[1.03] shadow-2xl"
                style={{
                  transform: `translateY(${getParallax(item.speed, idx * 3)}px)`,
                }}
              >
                <div className="text-5xl font-black text-[#64FFDA]/30 mb-5 tracking-tighter drop-shadow-sm">
                  {item.step}
                </div>
                <span className="inline-block text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-[#64FFDA]/15 text-[#64FFDA] mb-4 shadow-sm">
                  {item.forWho}
                </span>
                <h3 className="text-xl font-bold text-[#FFF4E6] mb-3">
                  {item.title}
                </h3>
                <p className="text-[#E0F7FA]/90 leading-relaxed text-sm font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== ANALYTICS SHOWCASE — The Deep ======================== */}
      <section
        ref={analyticsRef}
        className="relative min-h-screen flex items-center py-48 px-6 lg:px-8 bg-transparent"
      >
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-[#FFF4E6] tracking-tight drop-shadow-md">
              What the Data Reveals
            </h2>
            <p className="mt-3 text-xl text-[#64FFDA] font-semibold tracking-wider">
              Insights that actually help you improve
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: <FiCompass />,
                title: "Self-Guided Review",
                forWho: "For Students",
                desc: "Upload personal reading materials to the Practice Arena to generate AI flashcards and independently test your recall.",
                speed: 0.02,
              },
              {
                icon: <FiBarChart2 />,
                title: "Question Effectiveness",
                forWho: "For Instructors",
                desc: "Find out which questions were too easy, too hard, or perfectly balanced to refine future tests.",
                speed: 0.04,
              },
              {
                icon: <FiUsers />,
                title: "Class Overview",
                forWho: "For Instructors",
                desc: "See how your class is doing collectively. Identify macro trends and export detailed results for your records.",
                speed: 0.04,
              },
              {
                icon: <FiTrendingUp />,
                title: "Distractor Traps",
                forWho: "For Instructors",
                desc: "Automatically flag the incorrect multiple-choice options that successfully tricked the largest portion of your class.",
                speed: 0.05,
              },
            ].map((insight, idx) => (
              <div
                key={idx}
                className="group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-[#64FFDA]/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(100,255,218,0.1)]"
                style={{
                  transform: `translateY(${getParallax(insight.speed, idx * 8)}px)`,
                }}
              >
                <div className="flex items-start gap-6">
                  <div className="text-3xl text-[#64FFDA] mt-1 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 drop-shadow-md">
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <span className="inline-block text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-[#64FFDA]/15 text-[#64FFDA] mb-3 shadow-sm">
                      {insight.forWho}
                    </span>
                    <h3 className="text-xl font-bold text-[#FFF4E6] mb-2">
                      {insight.title}
                    </h3>
                    <p className="text-[#E0F7FA]/90 text-sm leading-relaxed font-medium">
                      {insight.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== FAQ — The Abyss ======================== */}
      <section
        ref={faqRef}
        className="relative min-h-screen flex items-center py-48 px-6 lg:px-8 bg-transparent"
      >
        <div className="max-w-4xl mx-auto w-full relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-[#FFF4E6] tracking-tight drop-shadow-md">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-xl text-[#64FFDA] font-semibold tracking-wider">
              Everything you need to know about DEPTH
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="bg-[#050A12]/60 backdrop-blur-xl rounded-2xl border border-[#64FFDA]/10 hover:border-[#64FFDA]/30 transition-all duration-300 overflow-hidden shadow-lg"
              >
                <button
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  onClick={() => toggleFaq(index)}
                >
                  <span className="text-lg md:text-xl font-bold text-[#FFF4E6] pr-8">
                    {faq.question}
                  </span>
                  <span className="text-[#64FFDA] text-2xl flex-shrink-0 ml-4">
                    {openFaq === index ? <FiMinus /> : <FiPlus />}
                  </span>
                </button>
                <div
                  className={`px-6 transition-all duration-300 ease-in-out overflow-hidden ${openFaq === index ? "max-h-96 pb-6 opacity-100" : "max-h-0 pb-0 opacity-0"}`}
                >
                  <p className="text-[#E0F7FA]/90 font-medium leading-relaxed border-t border-[#64FFDA]/20 pt-4">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== FOOTER — The Ocean Floor ======================== */}
      <footer
        ref={footerRef}
        className="relative min-h-[50vh] flex flex-col items-center justify-center px-6 lg:px-8 py-20 bg-transparent"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#64FFDA]/10 blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-[#64FFDA]/5 blur-[120px] animate-pulse-slower" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <FiAnchor className="text-6xl text-[#64FFDA] drop-shadow-[0_0_15px_rgba(100,255,218,0.5)] animate-float" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#FFF4E6] tracking-tight drop-shadow-md">
            Ready to See the Full Picture?
          </h2>
          <p className="mt-5 text-lg font-medium text-[#E0F7FA]/90 max-w-2xl mx-auto leading-relaxed">
            Instructors can set up an account to manage classes, generate AI
            questions, and analyze data. Students just need a code.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/instructor-signup"
              className="px-10 py-4 rounded-full bg-[#64FFDA] text-[#050A12] font-black tracking-wide hover:bg-[#4DD0C7] hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(100,255,218,0.2)]"
            >
              Instructor Signup
            </Link>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 w-full max-w-sm mx-auto">
            <p className="text-sm font-medium text-[#E0F7FA]/40 tracking-wider">
              &copy; 2026 DEPTH Analytics. Built for the deep end.
            </p>
          </div>
        </div>
      </footer>

      {/* ======================== ANIMATION STYLES ======================== */}
      <style>{`
        @keyframes wave-slow { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes wave-medium { 0% { transform: translateX(0); } 100% { transform: translateX(-45%); } }
        @keyframes wave-fast { 0% { transform: translateX(0); } 100% { transform: translateX(-40%); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        @keyframes pulse-slower { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.5; } }
        @keyframes cloud-1 { 0% { transform: translateX(0) scale(1); } 50% { transform: translateX(30px) scale(1.05); } 100% { transform: translateX(0) scale(1); } }
        @keyframes cloud-2 { 0% { transform: translateX(0) scale(1); } 50% { transform: translateX(-25px) scale(1.05); } 100% { transform: translateX(0) scale(1); } }
        @keyframes bubble-rise {
          0% { transform: translateY(100vh) scale(0.5); opacity: 0; }
          10% { opacity: 0.4; }
          80% { opacity: 0.4; }
          100% { transform: translateY(-50vh) scale(1.5); opacity: 0; }
        }
        .animate-wave-slow { animation: wave-slow 30s linear infinite; }
        .animate-wave-medium { animation: wave-medium 22s linear infinite; }
        .animate-wave-fast { animation: wave-fast 15s linear infinite; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 5s ease-in-out infinite; }
        .animate-pulse-slower { animation: pulse-slower 8s ease-in-out infinite; }
        .animate-cloud-1 { animation: cloud-1 25s ease-in-out infinite; }
        .animate-cloud-2 { animation: cloud-2 20s ease-in-out infinite; }
        .animate-bubble-rise { animation: bubble-rise linear infinite; }
      `}</style>
    </div>
  );
};

export default Home;
