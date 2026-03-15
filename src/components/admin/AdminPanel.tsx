import { useState } from 'react';
import { api } from '@/services/api';
import { Shield, X, Clock, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [days, setDays] = useState(30);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [opStatus, setOpStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [opMessage, setOpMessage] = useState('');

  if (!isOpen) return null;

  const handleLogin = () => {
    // Simple "admin" password for prototype
    if (password === 'admin123' || password === 'seizureblazer') {
      setIsAuthenticated(true);
    } else {
      alert('ACCESS DENIED');
    }
  };

  const handleExtend = async () => {
    setOpStatus('loading');
    try {
      await api.extendTime(days);
      setOpStatus('success');
      setOpMessage(`LICENSE EXTENDED BY ${days} DAYS`);
      setTimeout(() => {
        setOpStatus('idle');
        onClose();
      }, 2000);
    } catch (error) {
      setOpStatus('error');
      setOpMessage('Failed to extend license');
      setTimeout(() => setOpStatus('idle'), 3000);
    }
  };

  const handleDataOp = async () => {
    const confirmMsg = 'WARNING: This will wipe all units, incidents, and tracking history. Are you sure?';
    
    if (!confirm(confirmMsg)) return;

    setOpStatus('loading');
    try {
      await api.resetSystem();
      setOpMessage('SYSTEM CLEARED SUCCESSFULLY');
      setOpStatus('success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      setOpStatus('error');
      setOpMessage('OPERATION FAILED');
      setTimeout(() => setOpStatus('idle'), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-stone-950 border border-stone-800 rounded-lg p-6 shadow-2xl relative overflow-hidden">
        {/* Progress Overlay */}
        {opStatus !== 'idle' && (
          <div className={cn(
            "absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm transition-colors duration-500",
            opStatus === 'loading' ? 'bg-black/40' : 
            opStatus === 'success' ? 'bg-emerald-900/40' : 'bg-red-900/40'
          )}>
            {opStatus === 'loading' && <div className="w-8 h-8 border-2 border-stone-500 border-t-white rounded-full animate-spin mb-4" />}
            {opStatus === 'success' && <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.4)]"><Save className="w-6 h-6 text-black" /></div>}
            {opStatus === 'error' && <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(239,68,68,0.4)]"><X className="w-6 h-6 text-black" /></div>}
            
            <div className={cn(
              "font-mono font-bold text-sm tracking-widest animate-pulse",
              opStatus === 'loading' ? 'text-stone-400' : 
              opStatus === 'success' ? 'text-emerald-400' : 'text-red-400'
            )}>
              {opStatus === 'loading' ? 'PROCESSING...' : opMessage}
            </div>
            
            {opStatus === 'success' && (
              <div className="text-[10px] font-mono text-emerald-500/60 mt-2">REBOOTING SYSTEM...</div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mb-6 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-2 text-stone-200">
            <Shield className="w-5 h-5 text-red-500" />
            <h2 className="font-mono font-bold">ADMIN CONSOLE</h2>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-stone-500 mb-1">ADMIN PASSWORD</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 font-mono focus:border-red-500 outline-none"
                placeholder="ENTER CREDENTIALS"
              />
            </div>
            <button 
              onClick={handleLogin}
              className="w-full bg-stone-800 hover:bg-stone-700 text-white font-mono font-bold py-2 rounded transition-colors"
            >
              AUTHENTICATE
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-stone-900 p-4 rounded border border-stone-800">
              <h3 className="text-xs font-mono text-stone-400 mb-4 uppercase">Manual Override: Extend License</h3>
              
              <div className="flex items-center gap-4 mb-4">
                <button 
                  onClick={() => setDays(7)}
                  className={`flex-1 py-2 rounded text-xs font-mono border ${days === 7 ? 'bg-red-900/20 border-red-500 text-red-400' : 'bg-stone-800 border-stone-700 text-stone-400'}`}
                >
                  +7 DAYS
                </button>
                <button 
                  onClick={() => setDays(30)}
                  className={`flex-1 py-2 rounded text-xs font-mono border ${days === 30 ? 'bg-red-900/20 border-red-500 text-red-400' : 'bg-stone-800 border-stone-700 text-stone-400'}`}
                >
                  +30 DAYS
                </button>
                <button 
                  onClick={() => setDays(365)}
                  className={`flex-1 py-2 rounded text-xs font-mono border ${days === 365 ? 'bg-red-900/20 border-red-500 text-red-400' : 'bg-stone-800 border-stone-700 text-stone-400'}`}
                >
                  +1 YEAR
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-stone-500" />
                <input 
                  type="number" 
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value))}
                  className="bg-transparent border-b border-stone-700 text-stone-200 font-mono w-16 text-center focus:border-red-500 outline-none"
                />
                <span className="text-xs font-mono text-stone-500">DAYS</span>
              </div>

              <button 
                onClick={handleExtend}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-mono font-bold py-2 rounded flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> APPLY EXTENSION
              </button>
            </div>

            <div className="bg-stone-900 p-4 rounded border border-stone-800">
              <h3 className="text-xs font-mono text-stone-400 mb-4 uppercase">Data Management</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => handleDataOp()}
                  className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-500 font-mono text-[10px] font-bold py-3 rounded border border-red-900/50 transition-colors"
                >
                  CLEAR ALL DATA
                </button>
                <p className="text-[9px] font-mono text-stone-600 text-center uppercase">
                  Use "Clear All Data" to remove all units and history before live operations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
