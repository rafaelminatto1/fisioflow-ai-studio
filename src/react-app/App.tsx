import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router";
import { Suspense, lazy } from "react";
import { Layout } from "@/react-app/components/Layout";
import { PageSkeleton } from "@/react-app/components/PageSkeleton";
import { AuthProvider } from "@/react-app/contexts/AuthContext";
import { ProtectedRoute } from "@/react-app/components/ProtectedRoute";
import { ErrorBoundary } from "@/react-app/components/ErrorBoundary";
import { ConnectionStatus } from "@/react-app/components/ConnectionStatus";
// import { PerformanceProvider } from "@/react-app/components/PerformanceProvider";

// Lazy load all pages for better performance
const Dashboard = lazy(() => import("@/react-app/pages/Dashboard"));
const Patients = lazy(() => import("@/react-app/pages/Patients"));
const PatientProfile = lazy(() => import("@/react-app/pages/PatientProfile"));
const BodyMap = lazy(() => import("@/react-app/pages/BodyMap"));
const Appointments = lazy(() => import("@/react-app/pages/Appointments"));
const Consultation = lazy(() => import("@/react-app/pages/Consultation"));
const Exercises = lazy(() => import("@/react-app/pages/Exercises"));
const Prescriptions = lazy(() => import("@/react-app/pages/Prescriptions"));
const Finance = lazy(() => import("@/react-app/pages/Finance"));
const Tasks = lazy(() => import("@/react-app/pages/Tasks"));
const Inventory = lazy(() => import("@/react-app/pages/Inventory"));
const KnowledgeBase = lazy(() => import("@/react-app/pages/KnowledgeBase"));
const Settings = lazy(() => import("@/react-app/pages/Settings"));

// Auth pages (not lazy loaded since they are critical)
const Login = lazy(() => import("@/react-app/pages/Login"));
const Register = lazy(() => import("@/react-app/pages/Register"));
const ForgotPassword = lazy(() => import("@/react-app/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/react-app/pages/ResetPassword"));

function AppContent() {
  const location = useLocation();
  
  // Check if current route is an auth route
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);
  
  if (isAuthRoute) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </Suspense>
    );
  }
  
  return (
    <ProtectedRoute>
      <Layout activeRoute={location.pathname}>
        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/patients/:id" element={<PatientProfile />} />
              <Route path="/patients/:patientId/body-map" element={<BodyMap />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/patients/:patientId/consultation/:appointmentId" element={<Consultation />} />
              <Route path="/exercises" element={<Exercises />} />
              <Route path="/prescriptions" element={<Prescriptions />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
          <ConnectionStatus />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
