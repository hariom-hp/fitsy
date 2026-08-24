import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';

/**
 * AdminRoute — wraps admin-only routes.
 *
 * Checks if user is authenticated and has administrative privileges (user.isAdmin === true).
 * If not authenticated, redirects to /auth.
 * If authenticated but non-admin, displays a clear Access Denied notice.
 */
export default function AdminRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface-container-low border border-outline-variant/40 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-on-surface">Admin Access Required</h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Your logged-in account (<strong>{user?.email}</strong>) does not have administrator privileges.
              Please sign in with an administrator account (such as <strong>admin@fitsy.com</strong>).
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              to="/auth"
              className="w-full py-3 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> Sign In with Admin Account
            </Link>
            <Link
              to="/"
              className="w-full py-3 rounded-full border border-outline-variant hover:bg-surface-container text-on-surface font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
