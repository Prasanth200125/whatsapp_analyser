// ============================================================
// DashboardPage.jsx — Main Dashboard (session list + upload)
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, MessageSquare, Trash2, LogOut, ChevronRight, AlertCircle, Clock, Settings, Info } from 'lucide-react';
import { sessionAPI } from '../api';
import { useAuth } from '../hooks/useAuth.jsx';
import GuideModal from '../components/GuideModal';
import './DashboardPage.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [sessions, setSessions]       = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [uploading, setUploading]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // session id to confirm delete
  const [pollingSessions, setPollingSessions] = useState(new Set());
  const [guideContext, setGuideContext] = useState(null); // 'upload' | null

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      const res = await sessionAPI.list();
      setSessions(res.data.sessions);
    } catch {
      // ignore
    } finally {
      setSessionsLoading(false);
    }
  }

  // ── File Upload via Dropzone ────────────────────────────────
  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    setUploadError('');

    if (rejectedFiles.length > 0) {
      const reason = rejectedFiles[0].errors[0]?.message || 'Invalid file.';
      setUploadError(`File rejected: ${reason}`);
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      setUploadError('Only .txt WhatsApp export files are accepted.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 15MB.');
      return;
    }

    setUploading(true);
    setUploadProgress('Uploading file...');

    const formData = new FormData();
    formData.append('chatFile', file);
    formData.append('name', file.name.replace('.txt', ''));

    try {
      const res = await sessionAPI.create(formData);
      const newSession = res.data.session;

      // Add to list immediately with 'parsing' status
      setSessions(prev => [newSession, ...prev]);
      setUploadProgress('File uploaded! Parsing messages...');

      // Poll until parsing completes
      pollSession(newSession.id);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(''), 3000);
    }
  }, []);

  // Start polling a session
  const pollSession = useCallback((sessionId) => {
    setPollingSessions(prev => new Set(prev).add(sessionId));
  }, []);

  // Effect to manage active polling intervals
  useEffect(() => {
    if (pollingSessions.size === 0) return;

    const interval = setInterval(async () => {
      for (const sessionId of pollingSessions) {
        try {
          const res = await sessionAPI.get(sessionId);
          const updated = res.data.session;
          
          setSessions(prev =>
            prev.map(s => s.id === sessionId ? { ...s, ...updated } : s)
          );

          if (['completed', 'failed', 'empty'].includes(updated.parse_status)) {
            setPollingSessions(prev => {
              const next = new Set(prev);
              next.delete(sessionId);
              return next;
            });
          }
        } catch {
          setPollingSessions(prev => {
            const next = new Set(prev);
            next.delete(sessionId);
            return next;
          });
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pollingSessions]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.txt'] },
    maxFiles: 1,
    disabled: uploading,
  });

  // ── Delete Session ──────────────────────────────────────────
  async function handleDelete(sessionId) {
    try {
      await sessionAPI.delete(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed.');
    } finally {
      setDeleteConfirm(null);
    }
  }

  // ── Logout ──────────────────────────────────────────────────
  async function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  // ── Helpers ─────────────────────────────────────────────────
  function statusBadge(status) {
    const map = {
      completed: { cls: 'badge-green',  label: 'Ready' },
      parsing:   { cls: 'badge-gray',   label: 'Parsing...' },
      pending:   { cls: 'badge-gray',   label: 'Pending' },
      failed:    { cls: 'badge-red',    label: 'Failed' },
      empty:     { cls: 'badge-red',    label: 'Empty' },
    };
    const { cls, label } = map[status] || map.pending;
    return <span className={`badge ${cls}`}>{label}</span>;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  function formatNumber(n) {
    if (!n) return '0';
    return Number(n).toLocaleString('en-IN');
  }

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <header className="dash-header">
        <div className="dash-header-left">
          <div className="dash-logo">💬</div>
          <div>
            <div className="dash-logo-text">WhatsApp Analyzer</div>
            <div className="dash-welcome">Welcome back, {user?.name?.split(' ')[0]} 👋</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" id="settings-btn" onClick={() => navigate('/settings')}>
            <Settings size={14} /> Settings
          </button>
          <button className="btn btn-secondary btn-sm" id="logout-btn" onClick={handleLogout}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="dash-main">
        {/* ── Upload Zone ── */}
        <section className="dash-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h2 className="dash-section-title" style={{ margin: 0 }}>Upload a Chat</h2>
            <button className="btn-icon" onClick={() => setGuideContext('upload')} title="How to export chat">
              <Info size={16} />
            </button>
          </div>
          <p className="dash-section-desc">
            Export a WhatsApp chat (tap ⋮ → More → Export chat → Without media) and drop the .txt file here.
          </p>

          <div
            {...getRootProps()}
            className={`upload-zone ${isDragActive ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
            id="upload-dropzone"
          >
            <input {...getInputProps()} />
            <div className="upload-icon">
              {uploading ? <span className="spinner" style={{ width: 32, height: 32 }} /> : <Upload size={32} />}
            </div>
            {uploading ? (
              <p className="upload-text">{uploadProgress || 'Uploading...'}</p>
            ) : isDragActive ? (
              <p className="upload-text">Drop it here!</p>
            ) : (
              <>
                <p className="upload-text">Drag & drop your WhatsApp <strong>.txt</strong> file here</p>
                <p className="upload-hint">or click to browse — max 15MB</p>
              </>
            )}
          </div>

          {uploadError && (
            <div className="upload-error">
              <AlertCircle size={14} /> {uploadError}
            </div>
          )}
        </section>

        {/* ── Session List ── */}
        <section className="dash-section">
          <h2 className="dash-section-title">Your Chat Sessions</h2>

          {sessionsLoading ? (
            <div className="dash-loading">
              <span className="spinner" /> Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="dash-empty">
              <MessageSquare size={40} style={{ opacity: 0.3 }} />
              <p>No sessions yet. Upload a WhatsApp chat above to get started.</p>
            </div>
          ) : (
            <div className="session-grid">
              {sessions.map(session => (
                <div key={session.id} className="session-card">
                  {/* Parsing spinner overlay */}
                  {session.parse_status === 'parsing' && (
                    <div className="session-card-parsing-bar" />
                  )}

                  <div className="session-card-top">
                    <div className="session-card-name">{session.name}</div>
                    {statusBadge(session.parse_status)}
                  </div>

                  <div className="session-card-stats">
                    <div className="stat">
                      <span className="stat-val">{formatNumber(session.message_count)}</span>
                      <span className="stat-label">Messages</span>
                    </div>
                    <div className="stat">
                      <span className="stat-val">{session.participant_count ?? '—'}</span>
                      <span className="stat-label">People</span>
                    </div>
                    <div className="stat">
                      <span className="stat-val" style={{ fontSize: '0.8rem' }}>
                        {formatDate(session.first_message_at)}
                      </span>
                      <span className="stat-label">First msg</span>
                    </div>
                  </div>

                  <div className="session-card-footer">
                    <span className="session-date">
                      <Clock size={11} /> Uploaded {formatDate(session.created_at)}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-danger btn-sm"
                        id={`delete-session-${session.id}`}
                        onClick={() => setDeleteConfirm(session.id)}
                        title="Delete session"
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        id={`open-session-${session.id}`}
                        disabled={session.parse_status !== 'completed'}
                        onClick={() => navigate(`/session/${session.id}`)}
                      >
                        Open <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Delete Confirm Dialog ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Delete this session?</h3>
            <p>This will permanently delete all messages, analytics, and chat history for this session. This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" id="confirm-delete-btn" onClick={() => handleDelete(deleteConfirm)}>
                <Trash2 size={14} /> Delete forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Guide Modal ── */}
      <GuideModal
        isOpen={!!guideContext}
        onClose={() => setGuideContext(null)}
        context={guideContext}
      />
    </div>
  );
}
