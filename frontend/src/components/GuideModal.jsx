// ============================================================
// GuideModal.jsx — In-App Help System
// ============================================================
import { X, Lightbulb, TrendingUp, Search } from 'lucide-react';
import './GuideModal.css';

export default function GuideModal({ isOpen, onClose, context }) {
  if (!isOpen) return null;

  // Render content based on context (dashboard, chat, analytics)
  const getContent = () => {
    switch (context) {
      case 'chat':
        return (
          <>
            <p>Our hybrid chat engine routes questions automatically:</p>
            <ul>
              <li><strong>⚡ Rule-Based:</strong> Instant stats. Keywords: <em>how many, count, most, top, busiest</em>.</li>
              <li><strong>🤖 AI Engine:</strong> Deeper analysis. Works only when online.</li>
            </ul>
            <div className="guide-examples">
              <h4><Lightbulb size={16} /> Example AI Questions:</h4>
              <p>"Summarize this conversation"</p>
              <p>"What is the overall sentiment of this chat?"</p>
              <p>"Find all messages about the Goa trip"</p>
            </div>
            <div className="guide-examples">
              <h4><Search size={16} /> Example Rule-Based Questions:</h4>
              <p>"Who sent the most messages?"</p>
              <p>"What are the top 5 most used words?"</p>
              <p>"How many images were shared?"</p>
            </div>
          </>
        );
      case 'analytics':
        return (
          <>
            <p>The Analytics panel provides instant, offline-capable charts based on your WhatsApp history.</p>
            <div className="guide-examples">
              <h4><TrendingUp size={16} /> What you can see:</h4>
              <ul>
                <li><strong>Activity Timeline:</strong> Spikes in conversation over time.</li>
                <li><strong>Peak Hours:</strong> The time of day you chat the most.</li>
                <li><strong>Word Cloud:</strong> Most frequently used words (excluding common stop words).</li>
                <li><strong>Response Time:</strong> Who replies the fastest on average.</li>
              </ul>
            </div>
          </>
        );
      case 'upload':
      default:
        return (
          <>
            <p>To analyze a chat, you need to export it from WhatsApp as a <code>.txt</code> file.</p>
            <div className="guide-examples">
              <h4>How to export on iOS/Android:</h4>
              <ol>
                <li>Open WhatsApp and go to the chat you want to analyze.</li>
                <li>Tap the contact or group name at the top.</li>
                <li>Scroll down and tap <strong>Export Chat</strong>.</li>
                <li>Select <strong>Without Media</strong>.</li>
                <li>Save the <code>.txt</code> file to your device.</li>
                <li>Upload it here!</li>
              </ol>
            </div>
          </>
        );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal guide-modal" onClick={e => e.stopPropagation()}>
        <div className="guide-modal-header">
          <h3>ℹ️ How to use this feature</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="guide-modal-content">
          {getContent()}
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}
