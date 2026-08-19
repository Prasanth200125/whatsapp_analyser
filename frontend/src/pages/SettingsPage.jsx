// ============================================================
// SettingsPage.jsx — User Settings and Account Management
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Save, Trash2, ArrowLeft, Key } from 'lucide-react';
import { userAPI } from '../api';
import { useAuth } from '../hooks/useAuth.jsx';
import './SettingsPage.css';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();

  // Model settings state
  const [model, setModel] = useState(user?.preferred_model || 'google/gemma-4-31b-it:free');
  const [modelSaving, setModelSaving] = useState(false);
  const [modelSuccess, setModelSuccess] = useState('');
  const [modelError, setModelError] = useState('');

  // Password state
  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [passSaving, setPassSaving] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Delete account state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ── Handle Model Update ─────────────────────────────────────
  async function handleModelUpdate(e) {
    e.preventDefault();
    setModelSaving(true);
    setModelError('');
    setModelSuccess('');
    try {
      const res = await userAPI.updateSettings({ preferred_model: model });
      setModelSuccess('Model preference updated successfully.');
      // Update context user
      setUser(prev => ({ ...prev, preferred_model: res.data.settings.preferred_model }));
      localStorage.setItem('user', JSON.stringify({ ...user, preferred_model: res.data.settings.preferred_model }));
    } catch (err) {
      setModelError(err.response?.data?.error || 'Failed to update model.');
    } finally {
      setModelSaving(false);
    }
  }

  // ── Handle Password Update ──────────────────────────────────
  async function handlePasswordUpdate(e) {
    e.preventDefault();
    setPassSaving(true);
    setPassError('');
    setPassSuccess('');
    try {
      await userAPI.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      setPassSuccess('Password updated successfully.');
      setPasswords({ current: '', new: '' });
    } catch (err) {
      setPassError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setPassSaving(false);
    }
  }

  // ── Handle Account Deletion ─────────────────────────────────
  async function handleDeleteAccount() {
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await userAPI.deleteAccount({ confirmPassword: deletePassword });
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Failed to delete account.');
      setDeleteLoading(false);
    }
  }

  return (
    <div className="settings-page">
      <header className="dash-header">
        <div className="dash-header-left">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
        <div className="dash-header-right">
          <span className="dash-welcome">Settings</span>
        </div>
      </header>

      <main className="settings-main">
        <h1 className="settings-title"><Settings size={24} /> Account Settings</h1>

        {/* ── Model Preference Section ── */}
        <section className="settings-section">
          <h2>AI Model Preference</h2>
          <p className="settings-desc">Choose which AI model powers your chat analysis.</p>
          
          <form className="settings-form" onSubmit={handleModelUpdate}>
            <div className="form-group">
              <label htmlFor="model-select" className="label">Preferred Model</label>
              <select
                id="model-select"
                className="input"
                value={model}
                onChange={e => setModel(e.target.value)}
                disabled={modelSaving}
              >
                <option value="google/gemma-4-31b-it:free">Gemma 4 31B (Fast)</option>
                <option value="openai/gpt-oss-20b:free">GPT-OSS 20B (Smart)</option>
                <option value="nvidia/nemotron-3-nano-30b-a3b:free">Nemotron 3 Nano (Balanced)</option>
              </select>
            </div>
            
            {modelError ? <div className="error-text" style={{marginBottom:'1rem'}}>{modelError}</div> :
             modelSuccess ? <div className="success-text" style={{marginBottom:'1rem'}}>{modelSuccess}</div> : null}
            
            <button type="submit" className="btn btn-primary" disabled={modelSaving || model === user?.preferred_model}>
              {modelSaving ? <span className="spinner"></span> : <Save size={16} />} Save Model
            </button>
          </form>
        </section>

        {/* ── Change Password Section ── */}
        <section className="settings-section">
          <h2>Change Password</h2>
          <form className="settings-form" onSubmit={handlePasswordUpdate}>
            <div className="form-group">
              <label htmlFor="current-pwd" className="label">Current Password</label>
              <input
                id="current-pwd"
                type="password"
                className="input"
                value={passwords.current}
                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-pwd" className="label">New Password</label>
              <input
                id="new-pwd"
                type="password"
                className="input"
                value={passwords.new}
                onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                required
                minLength={8}
              />
            </div>
            
            {passError ? <div className="error-text" style={{marginBottom:'1rem'}}>{passError}</div> :
             passSuccess ? <div className="success-text" style={{marginBottom:'1rem'}}>{passSuccess}</div> : null}
            
            <button type="submit" className="btn btn-primary" disabled={passSaving || !passwords.current || !passwords.new}>
              {passSaving ? <span className="spinner"></span> : <Key size={16} />} Update Password
            </button>
          </form>
        </section>

        {/* ── Danger Zone ── */}
        <section className="settings-section danger-zone">
          <h2>Danger Zone</h2>
          <p className="settings-desc">Permanently delete your account and all associated WhatsApp chat data.</p>
          <button className="btn btn-danger" onClick={() => setDeleteConfirmOpen(true)}>
            <Trash2 size={16} /> Delete Account
          </button>
        </section>
      </main>

      {/* ── Delete Account Confirm Modal ── */}
      {deleteConfirmOpen && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Account Permanently?</h3>
            <p className="modal-warning">
              This action <strong>cannot be undone</strong>. This will permanently delete your account, all sessions, all uploaded `.txt` files, and all chat history.
            </p>
            
            <div className="form-group" style={{ marginTop: '1rem', textAlign: 'left' }}>
              <label htmlFor="delete-pwd" className="label">Confirm your password to proceed:</label>
              <input
                id="delete-pwd"
                type="password"
                className="input"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
              />
            </div>
            
            {deleteError && <div className="error-text" style={{ marginTop: '0.5rem' }}>{deleteError}</div>}
            
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmOpen(false)} disabled={deleteLoading}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={deleteLoading || !deletePassword}>
                {deleteLoading ? <span className="spinner"></span> : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
