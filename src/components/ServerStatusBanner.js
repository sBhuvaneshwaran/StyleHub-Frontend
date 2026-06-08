import React, { useEffect, useState } from 'react';
import emitter, { getStatus } from '../utils/backendStatus';

import './ServerStatusBanner.css';

const ServerStatusBanner = () => {
  const [status, setStatusLocal] = useState(getStatus());
  const localFallback = process.env.REACT_APP_LOCAL_AUTH_FALLBACK === 'true';

  useEffect(() => {
    const handler = (e) => setStatusLocal(e.detail);
    emitter.addEventListener('status', handler);
    return () => emitter.removeEventListener('status', handler);
  }, []);

  if (status === 'up' && !localFallback) return null;

  const text = localFallback
    ? 'Backend unavailable — local auth fallback enabled for development.'
    : 'Backend appears to be down (500/timeout). The app is running with local fallbacks.';

  return (
    <div className={`server-banner ${status === 'up' ? 'info' : 'error'}`}>
      <div className="server-banner-inner">{text}</div>
    </div>
  );
};

export default ServerStatusBanner;
