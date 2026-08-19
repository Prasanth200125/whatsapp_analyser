// ============================================================
// LoginPage.jsx — User Login Screen
// ============================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, BarChart2, Brain, Lock } from 'lucide-react';
import { authAPI } from '../api';
import { useAuth } from '../hooks/useAuth.jsx';
import './auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm]         = useState({ email: '', password: '' });
  const [errors, setErrors]     = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading]   = useState(false);

  function validate() {
    const e = {};
    if (!form.email.trim())    e.email    = 'Email is required.';
    if (!form.password.trim()) e.password = 'Password is required.';
    return e;
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    setGlobalError('');
    setErrors({});

    try {
      const res = await authAPI.login(form);

      if (!res.data || !res.data.token) {
        throw new Error('Invalid response from server. The API URL might be misconfigured.');
      }

      login(res.data.token, res.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Something went wrong. Please try again.';
      setGlobalError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* ── Left Panel ── */}
      <div className="auth-left">
        <div className="auth-logo">
          <div className="auth-logo-icon">💬</div>
          <span className="auth-logo-text">WhatsApp Analyzer</span>
        </div>
        <h1 className="auth-tagline">
          Understand your chats like <span>never before</span>
        </h1>
        <p className="auth-desc">
          Upload any WhatsApp export. Get instant analytics, ask questions in plain English, and discover hidden patterns in your conversations.
        </p>
        <ul className="auth-features">
          {[
            { icon: <BarChart2 size={16} />, text: 'Deep analytics — messages, timelines, word clouds' },
            { icon: <Brain size={16} />,     text: 'AI-powered Q&A — ask anything about your chat' },
            { icon: <MessageSquare size={16} />, text: 'Supports iOS & Android WhatsApp exports' },
            { icon: <Lock size={16} />,      text: 'Private & secure — your data stays yours' },
          ].map((f, i) => (
            <li key={i} className="auth-feature">
              <span className="auth-feature-icon">{f.icon}</span>
              {f.text}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <h2 className="auth-form-title">Welcome back</h2>
          <p className="auth-form-subtitle">
            Don't have an account? <Link to="/register">Sign up free</Link>
          </p>

          {globalError && (
            <div className="auth-global-error">{globalError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email"
                autoFocus
              />
              {errors.email && <p className="error-msg">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label className="label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="input"
                placeholder="Your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
              />
              {errors.password && <p className="error-msg">{errors.password}</p>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              id="login-submit-btn"
            >
              {loading ? <><span className="spinner" />Signing in...</> : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
