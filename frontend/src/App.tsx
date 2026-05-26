import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n';
import { ToastProvider } from './components/Toast';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import BookingPage from './pages/BookingPage';
import DashboardPage from './pages/DashboardPage';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherLogin from './pages/TeacherLogin';
import StudentLogin from './pages/StudentLogin';
import { PaymentSuccess, PaymentCancelled } from './pages/PaymentStatus';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';
import LegalNotice from './pages/LegalNotice';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import ForgotPassword from './pages/ForgotPassword';
import { CookieBanner } from './components/CookieBanner';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <LanguageProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/profile/:id?" element={<ProfilePage />} />
              <Route path="/book/:id" element={<BookingPage />} />
              <Route path="/booking/:id" element={<BookingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/student/login" element={<StudentLogin />} />
              <Route path="/student/forgot-password" element={<ForgotPassword role="student" />} />
              <Route path="/student/reset-password" element={<ForgotPassword role="student" />} />
              <Route path="/teacher/login" element={<TeacherLogin />} />
              <Route path="/teacher/forgot-password" element={<ForgotPassword role="teacher" />} />
              <Route path="/teacher/reset-password" element={<ForgotPassword role="teacher" />} />
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancelled" element={<PaymentCancelled />} />
              <Route path="/legal" element={<LegalNotice />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieBanner />
          </div>
        </Router>
      </LanguageProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
