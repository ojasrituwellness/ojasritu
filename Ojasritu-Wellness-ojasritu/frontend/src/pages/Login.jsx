import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "../styles/auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";
  const { login, user, loading: authLoading } = useAuth();
  const { refresh } = useCart();

  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectTo);
    }
  }, [authLoading, user, navigate, redirectTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const res = await login({ email, password });

    if (!res.ok) {
      // Minimal logging for debugging
      console.error('Login failed', res);
      setError(res.error || 'Login failed');
      return;
    }

    // Refresh cart for the newly authenticated session
    try { await refresh(); } catch (_) { /* ignore */ }

    // Navigate to the intended destination (defaults to home)
    navigate(redirectTo);
  };



  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Welcome back</h2>

        {error && <div className="alert error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label>Password</label>
          <div className="password-row">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="show-hide" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>

          <div className="auth-actions">
            <button className="btn primary" type="submit" disabled={authLoading}>{authLoading ? 'Signing in...' : 'Sign in'}</button>
            <Link to="/forgot-password" className="link">Forgot password?</Link>
          </div>
        </form>

        <div className="divider">OR</div>

        {/* Django Allauth redirect-based Google OAuth - no JavaScript, no popups */}
        <div className="oauth">
          <a 
            href="/accounts/google/login/" 
            className="btn google-oauth"
            aria-label="Sign in with Google"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" style={{marginRight: '8px'}}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>
        </div>

        <div className="signup-link">Don't have an account? <Link to="/signup">Create new account</Link></div>
      </div>
    </div>
  );
}
