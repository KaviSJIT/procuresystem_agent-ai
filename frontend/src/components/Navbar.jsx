import React, { useState, useEffect } from 'react';
import { getHealth } from '../services/api';

export default function Navbar() {
  const [status, setStatus] = useState({ online: false, models: {} });

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await getHealth();
      setStatus({ online: true, models: data.models || {} });
    } catch {
      setStatus({ online: false, models: {} });
    }
  };

  const modelCount = Object.values(status.models).filter(Boolean).length;
  const totalModels = Object.keys(status.models).length || 3;

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-40">
      <div>
        <h2 className="text-sm font-semibold text-gray-800">Agentic AI Construction Procurement Management System</h2>
        <p className="text-xs text-gray-400">Intelligent Procurement Management Framework</p>
      </div>

      <div className="flex items-center space-x-4">
        <span className="hidden md:block text-xs text-gray-500">
          Models: <span className="font-semibold text-gray-700">{modelCount}/{totalModels} Available</span>
        </span>
        <div className="flex items-center space-x-2 text-xs font-medium">
          <span className={`w-2 h-2 rounded-full ${status.online ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className={status.online ? 'text-green-700' : 'text-red-600'}>
            System Status: {status.online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
}
