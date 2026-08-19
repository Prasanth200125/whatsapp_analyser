// ============================================================
// RegisterPage.jsx — User Registration Screen
// ============================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, BarChart2, Brain, Lock } from 'lucide-react';
import { authAPI } from '../api';
import { useAuth } from '../hooks/useAuth.jsx';
import './auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm]               = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors]           = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading]         = useState(false);

  function validate() {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = 'Name must be at least 2 characters.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Please enter a valid email address.';
    if (!form.password || form.password.length < 8)
      e.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirm)
      e.confirm = 'Passwords do not match.';
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
      // Register then immediately log in
      await authAPI.register({ name: form.name, email: form.email, password: form.password });
      const loginRes = await authAPI.login({ email: form.email, password: form.password });
      login(loginRes.data.token, loginRes.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.';
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
          Your chats tell a <span>story</span>
        </h1>
        <p className="auth-desc">
          Create your free account and start analyzing your WhatsApp conversations in seconds. No credit card. No limits.
        </p>
        <ul className="auth-features">
          {[
            { icon: <BarChart2 size={16} />, text: 'Instant analytics on any WhatsApp chat' },
            { icon: <Brain size={16} />,     text: 'Ask questions in plain English — AI answers' },
            { icon: <MessageSquare size={16} />, text: 'iOS & Android export formats supported' },
            { icon: <Lock size={16} />,      text: 'Your data is private and encrypted' },
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
          <h2 className="auth-form-title">Create your account</h2>
          <p className="auth-form-subtitle">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          {globalError && (
            <div className="auth-global-error">{globalError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="label" htmlFor="reg-name">Your name</label>
              <input
                id="reg-name"
                type="text"
                className="input"
                placeholder="Prasanth"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
              {errors.name && <p className="error-msg">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label className="label" htmlFor="reg-email">Email address</label>
              <input
                id="reg-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
              {errors.email && <p className="error-msg">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label className="label" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                className="input"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="new-password"
              />
              {errors.password && <p className="error-msg">{errors.password}</p>}
            </div>

            <div className="form-group">
              <label className="label" htmlFor="reg-confirm">Confirm password</label>
              <input
                id="reg-confirm"
                type="password"
                className="input"
                placeholder="Same password again"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                autoComplete="new-password"
              />
              {errors.confirm && <p className="error-msg">{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              id="register-submit-btn"
            >
              {loading ? <><span className="spinner" />Creating account...</> : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
