import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Shield, Lock, CreditCard, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

interface SubscriptionOverlayProps {
  onAdminOpen: () => void;
}

export default function SubscriptionOverlay({ onAdminOpen }: SubscriptionOverlayProps) {
  const [settings, setSettings] = useState<{ install_date: string, tier: string, expiry_date: string } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const data = await api.getSettings();
        setSettings(data);
        
        const expiry = new Date(data.expiry_date);
        const now = new Date();
        
        if (now > expiry) {
          setIsExpired(true);
        } else {
          setIsExpired(false);
          setTimeLeft(formatDistanceToNow(expiry, { addSuffix: true }));
        }
      } catch (error) {
        console.error("Failed to check subscription status", error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleUpgrade = async (tier: 'basic' | 'premium') => {
    try {
      await api.upgradeTier(tier);
      const data = await api.getSettings();
      setSettings(data);
      setIsExpired(false);
      setShowUpgradeModal(false);
      alert(`UPGRADE SUCCESSFUL: ${tier.toUpperCase()} TIER ACTIVATED`);
    } catch (error) {
      alert("Upgrade failed");
    }
  };

  if (!settings) return null;

  // If expired, show blocking overlay
  if (isExpired) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-stone-900 border border-red-500/50 rounded-lg p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6 animate-pulse" />
          <h1 className="text-3xl font-mono font-bold text-white mb-2">LICENSE EXPIRED</h1>
          <p className="text-stone-400 font-mono text-sm mb-6">
            YOUR TRIAL PERIOD HAS ENDED. ACCESS TO MILITARY GRADE PATROL TRACKING HAS BEEN SUSPENDED.
          </p>
          
          <div className="bg-black/50 p-4 rounded border border-stone-800 mb-6">
            <p className="text-xs font-mono text-stone-500 mb-1">CONTACT DEVELOPER FOR EXTENSION</p>
            <p className="text-lg font-mono font-bold text-orange-500 select-all">seizureblazer@gmail.com</p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded font-mono transition-colors"
            >
              PURCHASE LICENSE
            </button>
            <button 
              onClick={onAdminOpen}
              className="w-full bg-stone-800 hover:bg-stone-700 text-stone-400 font-bold py-3 rounded font-mono transition-colors text-xs"
            >
              ADMIN OVERRIDE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-4xl w-full bg-stone-900 border border-stone-700 rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            {/* Header / Info */}
            <div className="p-8 md:w-1/3 bg-stone-950 border-r border-stone-800 flex flex-col justify-between">
              <div>
                <Shield className="w-12 h-12 text-orange-500 mb-4" />
                <h2 className="text-2xl font-mono font-bold text-white mb-2">UPGRADE ACCESS</h2>
                <p className="text-stone-400 text-sm font-mono">
                  Unlock the full potential of the Military Grade Patrol Tracking system. Choose your operational tier.
                </p>
              </div>
              <div className="mt-8">
                <div className="text-xs font-mono text-stone-500 uppercase mb-1">Current Status</div>
                <div className="flex items-center gap-2 text-stone-300 font-mono text-sm">
                  <div className={`w-2 h-2 rounded-full ${settings.tier === 'free' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  {settings.tier.toUpperCase()} TIER
                </div>
                <div className="text-xs font-mono text-stone-500 mt-2">
                  EXPIRES {formatDistanceToNow(new Date(settings.expiry_date), { addSuffix: true })}
                </div>
              </div>
            </div>

            {/* Pricing Options */}
            <div className="p-8 md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Tier */}
              <div className="border border-stone-700 rounded-lg p-6 hover:border-stone-500 transition-colors bg-stone-900/50 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-mono font-bold text-white">BASIC</h3>
                  <div className="text-2xl font-bold text-orange-500 font-mono">$20 <span className="text-sm text-stone-500">/ MO</span></div>
                </div>
                <ul className="space-y-2 text-xs font-mono text-stone-400 mb-6 flex-1">
                  <li className="flex items-center gap-2"><div className="w-1 h-1 bg-orange-500 rounded-full" /> Limited Facilities</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 bg-orange-500 rounded-full" /> Standard Support</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 bg-orange-500 rounded-full" /> Basic Map Layers</li>
                </ul>
                <button 
                  onClick={() => handleUpgrade('basic')}
                  className="w-full bg-stone-800 hover:bg-stone-700 text-white py-2 rounded font-mono text-xs font-bold transition-colors"
                >
                  SELECT BASIC
                </button>
              </div>

              {/* Premium Tier */}
              <div className="border border-orange-500/50 rounded-lg p-6 bg-orange-500/5 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-orange-500 text-black text-[10px] font-bold px-2 py-1 font-mono">RECOMMENDED</div>
                <div className="mb-4">
                  <h3 className="text-lg font-mono font-bold text-white">PREMIUM</h3>
                  <div className="text-2xl font-bold text-orange-500 font-mono">$50 <span className="text-sm text-stone-500">/ MO</span></div>
                </div>
                <ul className="space-y-2 text-xs font-mono text-stone-300 mb-6 flex-1">
                  <li className="flex items-center gap-2"><div className="w-1 h-1 bg-orange-500 rounded-full" /> Full Service Access</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 bg-orange-500 rounded-full" /> Auto-Notification</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 bg-orange-500 rounded-full" /> Priority Support</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 bg-orange-500 rounded-full" /> Advanced Analytics</li>
                </ul>
                <button 
                  onClick={() => handleUpgrade('premium')}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2 rounded font-mono text-xs font-bold transition-colors shadow-lg shadow-orange-900/20"
                >
                  SELECT PREMIUM
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-white"
            >
              ✕
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}
