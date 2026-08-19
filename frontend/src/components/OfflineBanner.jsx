// ============================================================
// OfflineBanner.jsx — Internet Connectivity Detector
// ============================================================
import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [status, setStatus] = useState('online'); // 'online' | 'offline' | 'back-online'

  useEffect(() => {
    let timer;

    function handleOffline() {
      setStatus('offline');
    }

    function handleOnline() {
      setStatus('back-online');
      // Auto-hide "back online" message after 3 seconds
      timer = setTimeout(() => setStatus('online'), 3000);
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clearTimeout(timer);
    };
  }, []);

  if (status === 'online') return null;

  return (
    <div className={`offline-banner ${status}`}>
      {status === 'offline' && (
        <>
          <WifiOff size={14} style={{ display: 'inline', marginRight: 6 }} />
          You're offline. AI features are disabled. Analytics still work.
        </>
      )}
      {status === 'back-online' && (
        <>
          <Wifi size={14} style={{ display: 'inline', marginRight: 6 }} />
          Back online! All features restored.
        </>
      )}
    </div>
  );
}
