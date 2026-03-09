import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import BookingPage from './pages/BookingPage';
import DashboardPage from './pages/DashboardPage';
import { PaymentSuccess, PaymentCancelled } from './pages/PaymentStatus';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/profile/:id?" element={<ProfilePage />} />
              <Route path="/book/:id" element={<BookingPage />} />
              <Route path="/booking/:id" element={<BookingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancelled" element={<PaymentCancelled />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
