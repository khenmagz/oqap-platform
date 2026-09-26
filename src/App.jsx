import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from "react-router-dom";

// Layouts
import { ProtectedLayout } from "./components/layouts/ProtectedLayout";
import { PublicRoute } from "./components/layouts/PublicRoute";
import { PublicLayout } from "./components/layouts/PublicLayout";

// Components
import Home from "./components/Home";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { SignupInstructor } from "./components/SignupInstructor";
import { Dashboard } from "./components/Dashboard";
import { QuizStudio } from "./components/QuizStudio";
import { QuizPlayer } from "./components/QuizPlayer";
import { ForgotPassword } from "./components/ForgotPassword";
import { ResetPassword } from "./components/ResetPassword";
import { NotFound } from "./components/NotFound";
import { Analytics } from "./components/Analytics";
import { Logbook } from "./components/Logbook";
import { PracticeArena } from "./components/PracticeArena";
import { EditQuiz } from "./components/EditQuiz";
import { GuestJoin } from "./components/GuestJoin";
// Auth Provider
import { AuthProvider } from "./context/AuthContext";

const App = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        {/* GROUP 1: Public Routes */}
        <Route element={<PublicRoute />}>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/guest/:quizCode" element={<GuestJoin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/instructor-signup" element={<SignupInstructor />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* GROUP 2: Protected Routes (With Sidebar/Navbar) */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/manage" element={<QuizStudio />} />
          <Route path="/dashboard/analytics" element={<Analytics />} />
          <Route path="/dashboard/logbook" element={<Logbook />} />{" "}
          <Route path="/dashboard/practice" element={<PracticeArena />} />
          <Route path="/dashboard/edit-quiz/:quizId" element={<EditQuiz />} />
        </Route>

        {/* GROUP 3: Isolated Routes (NO Sidebar, Fullscreen Player) */}
        <Route path="/voyage/:quizId" element={<QuizPlayer />} />

        {/* GROUP 4: Fallback */}
        <Route path="*" element={<NotFound />} />
      </>,
    ),
  );

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
