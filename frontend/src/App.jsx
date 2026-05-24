import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import useAuthStore from './store/authStore';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import Home             from './pages/Home';
import Charities        from './pages/Charities';
import CharityDetail    from './pages/CharityDetail';
import DonationCheckout from './pages/DonationCheckout';
import About            from './pages/About';
import Contact          from './pages/Contact';
import Register         from './pages/Register';
import Login            from './pages/Login';
import ForgotPassword   from './pages/ForgotPassword';
import ResetPassword    from './pages/ResetPassword';
import VerifyEmail      from './pages/VerifyEmail';
import NotFound         from './pages/NotFound';
import UserDashboard     from './pages/dashboard/UserDashboard';
import CharityDashboard  from './pages/dashboard/CharityDashboard';
import AdminDashboard    from './pages/dashboard/AdminDashboard';

/* scroll to top on every route change */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const location = useLocation();

  return (
    <div className="page-wrapper">
      <ScrollToTop />
      <Navbar />
      <main className="page-main">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/"              element={<Home />} />
            <Route path="/charities"     element={<Charities />} />
            <Route path="/charities/:id" element={<CharityDetail />} />
            <Route path="/donate/:charityId" element={
              <ProtectedRoute><DonationCheckout /></ProtectedRoute>
            } />
            <Route path="/about"   element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/register"          element={<Register />} />
            <Route path="/login"             element={<Login />} />
            <Route path="/forgot-password"   element={<ForgotPassword />} />
            <Route path="/reset-password"    element={<ResetPassword />} />
            <Route path="/verify-email"      element={<VerifyEmail />} />
            <Route path="/dashboard" element={
              <ProtectedRoute><UserDashboard /></ProtectedRoute>
            } />
            <Route path="/charity-dashboard" element={
              <ProtectedRoute><CharityDashboard /></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
