import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "./Layout";

// Lazy load pages to reduce initial bundle size and break dependency chains
const CustomizePage = lazy(() => import("./pages/CustomizePage"));
const AnalyzePage = lazy(() => import("./pages/AnalyzePage"));
const Home = lazy(() => import("./pages/Home"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin">
      <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <LoginPage />
              </Suspense>
            }
          />
          <Route
            path="/register"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <RegisterPage />
              </Suspense>
            }
          />

          {/* Protected Routes */}
          <Route
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ProtectedRoute />
              </Suspense>
            }
          >
            <Route
              path="/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Home />
                </Suspense>
              }
            />
            <Route
              path="/customize"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <CustomizePage />
                </Suspense>
              }
            />
            <Route
              path="/analyze"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AnalyzePage />
                </Suspense>
              }
            />
            <Route
              path="/profile"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProfilePage />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
