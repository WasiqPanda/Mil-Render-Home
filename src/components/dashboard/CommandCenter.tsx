import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { api } from '@/services/api';
import { PatrolUnit, Incident, SystemAlert, User, HQ } from '@/types';
import TacticalMap from '@/components/map/TacticalMap';
import { TacticalCard, StatusBadge } from '@/components/ui/TacticalComponents';
import SubscriptionOverlay from '@/components/subscription/SubscriptionOverlay';
import AdminPanel from '@/components/admin/AdminPanel';
import Markdown from 'react-markdown';
import { 
  Signal, 
  Search, 
  Settings, 
  Bell,
  Activity,
  Shield,
  Crosshair,
  Plus,
  X,
  Filter,
  Battery,
  ChevronLeft,
  ChevronRight,
  Lock,
  LocateFixed,
  Target,
  AlertOctagon,
  Users,
  Map as MapIcon,
  LogOut,
  CheckCircle,
  Clock,
  Building2,
  Smartphone,
  Monitor
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { API_BASE_URL as BASE_URL } from '@/constants';

function SuperAdminDashboard({ user, onLogout, backgrounds, bgIndex }: { user: User, onLogout: () => void, backgrounds: string[], bgIndex: number }) {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const u = await api.getAdminUsers();
        setPendingUsers(u);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      // Super Admin always approves as 'operator'
      await api.approveUser(userId, 'operator', '');
      setPendingUsers(prev => prev.map(u => u.id === userId ? { ...u, isApproved: 1, role: 'operator' } : u));
    } catch (e) { alert("Approval failed"); }
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] text-stone-200 p-8 font-mono relative overflow-hidden">
      {/* Background Images with Crossfade */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {backgrounds.map((bg, idx) => (
          <motion.div
            key={bg}
            initial={{ opacity: 0 }}
            animate={{ opacity: bgIndex === idx ? 0.3 : 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${bg})` }}
          />
        ))}
        {/* Tactical Overlays */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      </div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <header className="flex justify-between items-center border-b border-stone-800 pb-6">
          <div className="flex items-center gap-4">
            <Shield className="w-10 h-10 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold tracking-tighter">SUPER ADMIN COMMAND</h1>
              <p className="text-[10px] text-stone-500 uppercase">Operator: {user.username || user.email}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 px-4 py-2 rounded text-xs transition-colors">
            <LogOut className="w-4 h-4" /> TERMINATE SESSION
          </button>
        </header>

        <section className="bg-[#1c1917] border border-stone-800 rounded-lg overflow-hidden">
            <div className="p-4 bg-stone-800/50 border-b border-stone-800 flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" /> Operator Authorization Queue
            </h2>
          </div>
          <div className="divide-y divide-stone-800">
            {loading ? (
              <div className="p-8 text-center text-stone-600 animate-pulse">SCANNING DATABASE...</div>
            ) : pendingUsers.length === 0 ? (
              <div className="p-8 text-center text-stone-600">NO PENDING OPERATORS</div>
            ) : (
              pendingUsers.map(u => (
                <div key={u.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-stone-100">{u.email || u.username}</div>
                    <div className="text-[10px] text-stone-500 uppercase">ID: {u.id} | ROLE: {u.role}</div>
                  </div>
                  
                  {Number(u.isApproved) === 0 ? (
                    <button 
                      onClick={() => handleApprove(u.id)}
                      className="bg-orange-700 hover:bg-orange-600 text-white px-4 py-2 rounded text-[10px] font-bold transition-colors"
                    >
                      AUTHORIZE AS OPERATOR
                    </button>
                  ) : (
                    <StatusBadge status="active" />
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function HQSelection({ user, onSelect, onLogout, backgrounds, bgIndex }: { user: User, onSelect: (id: string) => void, onLogout: () => void, backgrounds: string[], bgIndex: number }) {
  const [hqs, setHqs] = useState<HQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHQs().then(setHqs).finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-screen w-full bg-[#0c0a09] text-stone-200 flex flex-col items-center justify-center p-8 font-mono relative overflow-hidden">
      {/* Background Images with Crossfade */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {backgrounds.map((bg, idx) => (
          <motion.div
            key={bg}
            initial={{ opacity: 0 }}
            animate={{ opacity: bgIndex === idx ? 0.4 : 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${bg})` }}
          />
        ))}
        {/* Tactical Overlays */}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      </div>

      <div className="max-w-md w-full bg-[#1c1917]/80 backdrop-blur-xl border border-stone-700/30 p-8 rounded-lg space-y-8 relative z-10">
        <div className="absolute top-0 right-0 p-4">
          <button onClick={onLogout} className="text-stone-600 hover:text-stone-400 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center space-y-2">
          <Building2 className="w-12 h-12 text-orange-600 mx-auto" />
          <h2 className="text-xl font-bold tracking-widest uppercase">Select HQ Sector</h2>
          <p className="text-[10px] text-stone-500 uppercase">Operator: {user.email || user.username}</p>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 animate-pulse text-stone-600">SCANNING SECTORS...</div>
          ) : (
            hqs.map(h => (
              <button 
                key={h.id}
                onClick={() => onSelect(h.id)}
                className="w-full p-4 bg-black/50 border border-stone-800 hover:border-orange-500 hover:bg-orange-500/5 rounded-lg text-left transition-all group"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-stone-200 group-hover:text-orange-400">{h.name}</div>
                    <div className="text-[10px] text-stone-500">{h.location}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-700 group-hover:text-orange-500" />
                </div>
              </button>
            ))
          )}
        </div>

        <div className="text-center pt-4">
          <div className="text-[9px] text-stone-600 uppercase">
            Initiating individual session for specific HQ
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommandCenter() {
  const [units, setUnits] = useState<PatrolUnit[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Mobile State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [hqs, setHqs] = useState<HQ[]>([]);
  const [currentHqId, setCurrentHqId] = useState<string | null>(null);
  const [loginStep, setLoginStep] = useState<'idle' | 'authenticating' | 'success'>('idle');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [hqRegistrationStep, setHqRegistrationStep] = useState<'none' | 'register_hq' | 'select_hq' | 'pending_approval'>('none');
  const [availableHQs, setAvailableHQs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'map' | 'units' | 'intel'>('map');
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [bgIndex, setBgIndex] = useState(0);

  const backgrounds = [
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 10000); // Cycle every 10 seconds
    return () => clearInterval(interval);
  }, [backgrounds.length]);

  useEffect(() => {
    const checkAuth = async () => {
      const verifiedUser = await api.verifyToken();
      if (verifiedUser) {
        setUser(verifiedUser);
        setIsAuthenticated(true);
      }
    };
    checkAuth();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { token, user } = event.data;
        localStorage.setItem('token', token);
        setUser(user);
        setLoginStep('success');
        setTimeout(() => {
          setIsAuthenticated(true);
        }, 1500);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchHQs = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/hqs`);
      const data = await response.json();
      setAvailableHQs(data);
    } catch (e) {
      console.error("Failed to fetch HQs", e);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'operator' && !user.hqId) {
        setHqRegistrationStep('register_hq');
      } else if (user.role === 'patrol_user' && !user.hqId) {
        setHqRegistrationStep('select_hq');
        fetchHQs();
      } else if (!user.isApproved) {
        setHqRegistrationStep('pending_approval');
      } else {
        setHqRegistrationStep('none');
      }
    }
  }, [isAuthenticated, user]);

  const handleRegisterHQ = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const hqData = {
      name: formData.get('name'),
      location: formData.get('location'),
      additionalDetails: formData.get('additionalDetails')
    };

    try {
      const response = await fetch(`${BASE_URL}/api/hqs/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(hqData)
      });

      if (response.ok) {
        const data = await response.json();
        setUser(prev => prev ? { ...prev, hqId: data.hqId } : null);
        setHqRegistrationStep('pending_approval');
      }
    } catch (e) {
      console.error("HQ Registration failed", e);
    }
  };

  const handleJoinHQ = async (hqId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/join-request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ hqId })
      });

      if (response.ok) {
        setUser(prev => prev ? { ...prev, hqId } : null);
        setHqRegistrationStep('pending_approval');
      }
    } catch (e) {
      console.error("Join HQ failed", e);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const url = await api.getGoogleAuthUrl();
      window.open(url, 'google_auth', 'width=600,height=700');
    } catch (e) {
      setLoginError('Failed to initiate Google Login');
    }
  };
  const [isLoading, setIsLoading] = useState(true);

  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  // Removed unused userTier state

  // Filter State
  const [filterUnitType, setFilterUnitType] = useState<string>('all');
  const [filterUnitStatus, setFilterUnitStatus] = useState<string>('all');
  const [filterIncidentType, setFilterIncidentType] = useState<string>('all');
  const [filterIncidentPriority, setFilterIncidentPriority] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [isTrackingSelf, setIsTrackingSelf] = useState(false);
  const [followMe, setFollowMe] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [selfDeviceId] = useState(() => {
    const saved = localStorage.getItem('selfDeviceId');
    if (saved) return saved;
    const newId = `u-self-${Math.random().toString(36).slice(2, 7)}`;
    localStorage.setItem('selfDeviceId', newId);
    return newId;
  });

  const handleTrackSelf = () => {
    if (isTrackingSelf) {
      // Stop tracking
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      setIsTrackingSelf(false);
      setFollowMe(false);
      setWatchId(null);
      
      // Optionally mark unit as offline in backend
      api.registerUnit(selfDeviceId, { status: 'offline' });
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading } = position.coords;
        
        api.registerUnit(selfDeviceId, {
          callsign: user?.username ? `${user.username.toUpperCase()} (SELF)` : 'OPERATOR (SELF)',
          type: 'infantry',
          status: 'active',
          position: { lat: latitude, lng: longitude },
          heading: heading || 0,
          batteryLevel: 100,
          signalStrength: 100,
          currentTask: 'SELF TRACKING ACTIVE'
        });

        if (followMe) {
          setSelectedUnitId(selfDeviceId);
        }
      },
      (error) => {
        console.error("Error tracking location", error);
        let msg = "Unable to retrieve location";
        if (error.code === 1) msg = "Location access denied. Please enable permissions.";
        alert(msg);
        setIsTrackingSelf(false);
        setFollowMe(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    setWatchId(id);
    setIsTrackingSelf(true);
    setFollowMe(true); // Default to follow me when starting
    setSelectedUnitId(selfDeviceId);
  };

  // Filter Logic
  const filteredUnits = units.filter(u => 
    (filterUnitType === 'all' || u.type === filterUnitType) &&
    (filterUnitStatus === 'all' || u.status === filterUnitStatus)
  );

  const filteredIncidents = incidents.filter(i => 
    (filterIncidentType === 'all' || i.type === filterIncidentType) &&
    (filterIncidentPriority === 'all' || i.priority === filterIncidentPriority)
  );

  useEffect(() => {
    const fetchData = async () => {
      console.log("Fetching data from:", `${BASE_URL}/api/units`);
      try {
        const [fetchedUnits, fetchedIncidents] = await Promise.all([
          api.getUnits(),
          api.getIncidents()
        ]);
        setUnits(fetchedUnits);
        setIncidents(fetchedIncidents);
      } catch (error) {
        console.error("Failed to fetch data", error);
        console.error("BASE_URL was:", BASE_URL);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData(); // Initial fetch

    // Socket.io Connection
    const socket = io();

    socket.on('connect', () => {
      console.log('Connected to realtime feed');
    });

    socket.on('units:update', () => {
      api.getUnits().then(setUnits);
    });

    socket.on('incidents:update', () => {
      api.getIncidents().then(setIncidents);
    });

    const intervalId = setInterval(fetchData, 2000); // Poll every 2s for real-time updates (fallback/redundancy)

    return () => {
      clearInterval(intervalId);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-hide sidebar on selection (Desktop)
  useEffect(() => {
    if (selectedUnitId && window.innerWidth >= 768) {
      setIsSidebarOpen(false); 
    }
  }, [selectedUnitId]);

  const selectedUnit = units.find(u => u.id === selectedUnitId);
  const selectedIncident = incidents.find(i => i.id === selectedIncidentId);

  const handleUnitSelect = useCallback((id: string) => {
    setSelectedUnitId(id);
    setSelectedIncidentId(null); // Deselect incident
    setActiveTab('intel');
  }, []);

  const handleIncidentSelect = useCallback((id: string) => {
    setSelectedIncidentId(id);
    setSelectedUnitId(null); // Deselect unit
    setActiveTab('intel');
  }, []);

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    if (editingIncident) {
      // Update existing
      const updates: Partial<Incident> = {
        type: formData.get('type') as any,
        priority: formData.get('priority') as any,
        description: formData.get('description') as string,
      };

      try {
        await api.updateIncident(editingIncident.id, updates);
        setIncidents(prev => prev.map(i => i.id === editingIncident.id ? { ...i, ...updates } : i));
        setShowIncidentModal(false);
        setEditingIncident(null);
      } catch (error) {
        alert("Failed to update report");
      }
    } else {
      // Create new
      const newIncident: Incident = {
        id: `inc-${Date.now()}`,
        type: formData.get('type') as any,
        priority: formData.get('priority') as any,
        description: formData.get('description') as string,
        position: { lat: 36.1699, lng: -115.1398 }, // Default to center
        timestamp: new Date().toISOString(),
        status: 'open',
        reportedBy: 'HQ-COMMAND'
      };

      try {
        await api.reportIncident(newIncident);
        setIncidents(prev => [newIncident, ...prev]);
        setShowIncidentModal(false);
      } catch (error) {
        alert("Failed to transmit report");
      }
    }
  };

  const handleDispatch = async () => {
    if (!selectedIncident) return;
    try {
      await api.updateIncidentStatus(selectedIncident.id, 'investigating');
      setIncidents(prev => prev.map(i => i.id === selectedIncident.id ? { ...i, status: 'investigating' } : i));
      setAlerts(prev => [{
        id: `alert-${Date.now()}`,
        level: 'info',
        message: `UNIT DISPATCHED TO INCIDENT ${selectedIncident.id}`,
        timestamp: new Date().toISOString()
      }, ...prev]);
    } catch (error) {
      console.error("Failed to dispatch", error);
    }
  };

  const handleResolve = async () => {
    if (!selectedIncident) return;
    try {
      await api.updateIncidentStatus(selectedIncident.id, 'resolved');
      setIncidents(prev => prev.map(i => i.id === selectedIncident.id ? { ...i, status: 'resolved' } : i));
      setAlerts(prev => [{
        id: `alert-${Date.now()}`,
        level: 'success',
        message: `INCIDENT ${selectedIncident.id} RESOLVED`,
        timestamp: new Date().toISOString()
      }, ...prev]);
    } catch (error) {
      console.error("Failed to resolve", error);
    }
  };

  const toggleIncidentStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'resolved' ? 'open' : 'resolved';
    try {
      await api.updateIncidentStatus(id, newStatus);
      setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
      
      if (newStatus === 'resolved') {
        setAlerts(prev => [{
          id: `alert-${Date.now()}`,
          level: 'success',
          message: `INCIDENT ${id} RESOLVED`,
          timestamp: new Date().toISOString()
        }, ...prev]);
      }
    } catch (error) {
      console.error("Failed to toggle status", error);
    }
  };

  const handleEditIncident = () => {
    if (!selectedIncident) return;
    setEditingIncident(selectedIncident);
    setShowIncidentModal(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStep('authenticating');
    setLoginError('');

    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token (in a real app, use a more secure storage or httpOnly cookie)
      localStorage.setItem('token', data.token);
      setUser(data.user);
      
      setLoginStep('success');
      setTimeout(() => {
        setIsAuthenticated(true);
      }, 1500);
    } catch (error: any) {
      setLoginStep('idle');
      setLoginError(error.message);
    }
  };

  if (!isAuthenticated || hqRegistrationStep !== 'none') {
    return (
      <div className="h-screen w-full bg-[#0c0a09] text-stone-200 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Images with Crossfade */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {backgrounds.map((bg, idx) => (
            <motion.div
              key={bg}
              initial={{ opacity: 0 }}
              animate={{ opacity: bgIndex === idx ? 0.6 : 0 }}
              transition={{ duration: 2 }}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${bg})` }}
            />
          ))}
          {/* Tactical Overlays */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        </div>
        
        <div className="z-10 w-full max-w-md p-8 border border-stone-700/30 bg-[#1c1917]/80 backdrop-blur-xl rounded-lg shadow-2xl relative">
          {/* Corner Markers */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-orange-600" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-orange-600" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-orange-600" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-orange-600" />

          {!isAuthenticated && (
            <>
              <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-orange-600 mx-auto mb-4 animate-pulse" />
            <h1 className="text-2xl font-mono font-bold tracking-widest text-stone-100 mb-2 uppercase tracking-tighter">Tactical Command System</h1>
            <div className="text-xs font-mono text-orange-500 bg-orange-500/10 inline-block px-2 py-1 rounded border border-orange-500/20">
              RESTRICTED ACCESS // AUTHORIZED PERSONNEL ONLY
            </div>
          </div>

          {loginStep === 'idle' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-stone-500 uppercase">Operator ID / Username</label>
                  <input 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/50 border border-stone-700/30 rounded p-3 text-sm font-mono text-stone-200 focus:border-orange-500 outline-none transition-colors"
                    placeholder="ENTER ID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-stone-500 uppercase">Access Code / Password</label>
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/50 border border-stone-700/30 rounded p-3 text-sm font-mono text-stone-200 focus:border-orange-500 outline-none transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              
              {loginError && (
                <div className="text-xs font-mono text-red-500 bg-red-500/10 p-2 rounded border border-red-500/20">
                  ERROR: {loginError.toUpperCase()}
                </div>
              )}
              
              <button 
                type="submit"
                className="w-full bg-orange-700 hover:bg-orange-600 text-stone-100 font-bold font-mono py-3 rounded transition-all hover:shadow-[0_0_20px_rgba(234,88,12,0.3)] flex items-center justify-center gap-2"
              >
                <Activity className="w-4 h-4" /> INITIATE SECURE HANDSHAKE
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-700/50"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-[#1c1917] px-2 text-stone-500 font-mono">Or secure via</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white hover:bg-stone-100 text-stone-900 font-bold font-mono py-3 rounded transition-all flex items-center justify-center gap-2"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                GMAIL AUTHORIZATION
              </button>
              
              <div className="text-[10px] text-stone-600 font-mono text-center mt-4 uppercase">
                UNAUTHORIZED ACCESS CONSIDERED AS OFFENSE_ DEVELOPED BY WAHID
              </div>
            </form>
          )}

          {loginStep === 'authenticating' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" />
              <div className="font-mono text-xs text-orange-400 animate-pulse">
                ESTABLISHING ENCRYPTED TUNNEL...
                <br />
                VERIFYING BIOMETRICS...
              </div>
              <div className="h-1 w-full bg-stone-800 rounded overflow-hidden mt-4">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2 }}
                  className="h-full bg-orange-500"
                />
              </div>
            </div>
          )}

          {loginStep === 'success' && (
            <div className="text-center py-6">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Shield className="w-8 h-8 text-black" />
              </motion.div>
              <h2 className="text-xl font-mono font-bold text-stone-100 mb-1">ACCESS GRANTED</h2>
              <p className="text-xs font-mono text-orange-400 uppercase">Welcome back, Operator</p>
            </div>
          )}
          </>
          )}

          {/* HQ Registration (For Operators) */}
          {isAuthenticated && hqRegistrationStep === 'register_hq' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Shield className="w-12 h-12 text-orange-600 mx-auto mb-2" />
                <h2 className="text-xl font-mono font-bold uppercase tracking-widest">HQ REGISTRATION</h2>
                <p className="text-xs text-stone-500 font-mono uppercase">Complete cluster configuration</p>
              </div>
              <form onSubmit={handleRegisterHQ} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-stone-500 uppercase">HQ Name</label>
                  <input name="name" required className="w-full bg-black/50 border border-stone-700/30 rounded p-2 text-sm font-mono" placeholder="e.g. DHAKA SECTOR HQ" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-stone-500 uppercase">Location</label>
                  <input name="location" required className="w-full bg-black/50 border border-stone-700/30 rounded p-2 text-sm font-mono" placeholder="e.g. 23.8103, 90.4125" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-stone-500 uppercase">Additional Details</label>
                  <textarea name="additionalDetails" className="w-full bg-black/50 border border-stone-700/30 rounded p-2 text-sm font-mono h-20" placeholder="SECTOR CAPACITY, FREQUENCY, ETC." />
                </div>
                <button type="submit" className="w-full bg-orange-700 hover:bg-orange-600 text-white font-bold font-mono py-3 rounded transition-all">
                  REGISTER CLUSTER
                </button>
              </form>
            </div>
          )}

          {/* HQ Selection (For Patrol Users) */}
          {isAuthenticated && hqRegistrationStep === 'select_hq' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Building2 className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                <h2 className="text-xl font-mono font-bold uppercase tracking-widest">JOIN CLUSTER</h2>
                <p className="text-xs text-stone-500 font-mono uppercase">Select your assigned HQ</p>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {availableHQs.length === 0 ? (
                  <div className="text-center py-4 text-stone-500 font-mono text-xs uppercase">No active HQs found</div>
                ) : (
                  availableHQs.map(hq => (
                    <button 
                      key={hq.id}
                      onClick={() => handleJoinHQ(hq.id)}
                      className="w-full p-4 bg-stone-800/50 border border-stone-700/30 rounded text-left hover:border-blue-500 transition-colors group"
                    >
                      <div className="font-mono text-sm text-stone-200 group-hover:text-blue-400">{hq.name}</div>
                      <div className="text-[10px] text-stone-500 font-mono uppercase">{hq.location}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Pending Approval */}
          {isAuthenticated && hqRegistrationStep === 'pending_approval' && (
            <div className="text-center space-y-6 py-8">
              <div className="relative inline-block">
                <Lock className="w-16 h-16 text-orange-600 mx-auto" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-dashed border-orange-600/30 rounded-full"
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-mono font-bold uppercase tracking-widest">AUTHORIZATION PENDING</h2>
                <p className="text-xs text-stone-500 font-mono uppercase">Your account is awaiting manual authorization.</p>
              </div>
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded">
                <div className="text-xs font-mono text-orange-500 uppercase mb-1">HQ Approval Required</div>
                <div className="text-[10px] text-stone-400 font-mono uppercase">Please wait for authorization by your HQ Operator or Super Admin.</div>
              </div>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  setIsAuthenticated(false);
                  setUser(null);
                  setHqRegistrationStep('none');
                }}
                className="text-xs font-mono text-stone-500 hover:text-stone-300 underline uppercase"
              >
                Cancel & Logout
              </button>
            </div>
          )}
        </div>
        
        <div className="absolute bottom-4 text-[10px] font-mono text-stone-600">
          SYSTEM INTEGRITY: 100% | ENCRYPTION: AES-256-GCM
        </div>
      </div>
    );
  }

  // Removed old pending approval block

  // --- SUPER ADMIN DASHBOARD ---
  if (user?.role === 'super_admin') {
    return <SuperAdminDashboard user={user} onLogout={() => { localStorage.removeItem('token'); setIsAuthenticated(false); setUser(null); }} backgrounds={backgrounds} bgIndex={bgIndex} />;
  }

  // --- HQ SELECTION VIEW (For Operators) ---
  if ((user?.role === 'operator' || user?.role === 'hq_control') && !currentHqId) {
    return <HQSelection user={user} onSelect={(id) => setCurrentHqId(id)} onLogout={() => { localStorage.removeItem('token'); setIsAuthenticated(false); setUser(null); }} backgrounds={backgrounds} bgIndex={bgIndex} />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#0c0a09] text-stone-200 overflow-hidden relative">
      {/* Background Images with Crossfade */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {backgrounds.map((bg, idx) => (
          <motion.div
            key={bg}
            initial={{ opacity: 0 }}
            animate={{ opacity: bgIndex === idx ? 0.3 : 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${bg})` }}
          />
        ))}
        {/* Tactical Overlays */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      </div>
      
      {/* TOP HEADER */}
      <header className="h-14 border-b border-stone-700/30 bg-[#1c1917]/90 backdrop-blur flex items-center justify-between px-4 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-orange-500">
            <Shield className="w-6 h-6" />
            <span className="font-bold tracking-wider text-lg font-mono hidden sm:inline">MILITARY GRADE <span className="text-stone-100">PATROL TRACKING</span></span>
            <span className="font-bold tracking-wider text-lg font-mono sm:hidden">MG<span className="text-stone-100">PT</span></span>
          </div>
          <div className="h-6 w-px bg-stone-700/30 mx-2 hidden md:block" />
          <nav className="hidden md:flex items-center gap-1">
            {['COMMAND', 'INTEL', 'LOGISTICS'].map((item, i) => (
              <button 
                key={item}
                className={`px-3 py-1.5 text-xs font-mono font-bold hover:bg-stone-700/30 rounded transition-colors ${i === 0 ? 'text-orange-400 bg-orange-500/10' : 'text-stone-400'}`}
              >
                {item}
              </button>
            ))}
            <button 
              onClick={() => setIsAdminOpen(true)}
              className="px-3 py-1.5 text-xs font-mono font-bold hover:bg-stone-700/30 rounded transition-colors text-stone-400 flex items-center gap-1"
            >
              <Lock className="w-3 h-3" /> ADMIN
            </button>
            <button 
              onClick={() => setIsManualOpen(true)}
              className="px-3 py-1.5 text-xs font-mono font-bold hover:bg-stone-700/30 rounded transition-colors text-stone-400 flex items-center gap-1"
            >
              <Monitor className="w-3 h-3" /> MANUAL
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-xs font-mono text-stone-400">DTG (ZULU)</span>
            <span className="text-sm font-mono font-bold text-orange-400">
              {format(currentTime, "yyyy-MM-dd'T'HH:mm:ss'Z'")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleTrackSelf}
              className={`px-3 py-1.5 rounded-l text-xs font-bold font-mono flex items-center gap-2 transition-colors border ${isTrackingSelf ? 'bg-emerald-900/40 text-emerald-500 border-emerald-500/50 animate-pulse' : 'bg-stone-800 text-stone-400 border-stone-700/50 hover:bg-stone-700'}`}
            >
              <LocateFixed className="w-4 h-4" /> <span className="hidden sm:inline">{isTrackingSelf ? 'TRACKING ACTIVE' : 'TRACK DEVICE'}</span>
            </button>
            {isTrackingSelf && (
              <button 
                onClick={() => setFollowMe(!followMe)}
                className={`px-3 py-1.5 rounded-r text-[10px] font-bold font-mono transition-colors border-y border-r ${followMe ? 'bg-orange-900/40 text-orange-500 border-orange-500/50' : 'bg-stone-800 text-stone-500 border-stone-700/50'}`}
                title={followMe ? "Disable Follow Me" : "Enable Follow Me"}
              >
                {followMe ? 'FOLLOW ON' : 'FOLLOW OFF'}
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowIncidentModal(true)}
            className="bg-red-900/40 hover:bg-red-900/60 text-red-500 border border-red-500/50 px-3 py-1.5 rounded text-xs font-bold font-mono flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">REPORT</span>
          </button>
          <button 
            onClick={() => { localStorage.removeItem('token'); setIsAuthenticated(false); setUser(null); }}
            className="p-2 hover:bg-stone-700/30 rounded-full text-stone-400"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden relative">
        <SubscriptionOverlay onAdminOpen={() => setIsAdminOpen(true)} />
        <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
        
        {/* LEFT SIDEBAR - UNITS */}
        {isSidebarOpen && user?.role !== 'patrol_user' && (
          <aside className={cn(
            "md:flex md:col-span-3 lg:col-span-2 flex-col border-r border-stone-700/30 bg-[#0c0a09]/95 backdrop-blur z-20 absolute md:relative inset-0 md:inset-auto transition-transform duration-300",
            activeTab === 'units' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          )}>
            <div className="p-3 border-b border-stone-700/30 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-2 top-2 text-stone-500" />
                <input 
                  type="text" 
                  placeholder="SEARCH UNITS..." 
                  className="w-full bg-[#1c1917] border border-stone-700/30 rounded pl-8 pr-2 py-1.5 text-xs font-mono focus:outline-none focus:border-orange-500/50 transition-colors text-stone-300"
                />
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 hover:bg-stone-700/30 rounded border border-stone-700/30 hidden md:block"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4 text-stone-400" />
              </button>
              <button className="p-1.5 hover:bg-stone-700/30 rounded border border-stone-700/30 md:hidden">
                <Settings className="w-4 h-4 text-stone-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-20 md:pb-2">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] font-mono uppercase text-stone-500 font-bold">Active Units ({filteredUnits.length})</span>
                <Activity className="w-3 h-3 text-orange-500" />
              </div>
              
              {isLoading ? (
                <div className="p-4 text-center space-y-2">
                  <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" />
                  <div className="text-[10px] font-mono text-orange-500 animate-pulse">SCANNING FREQUENCIES...</div>
                </div>
              ) : filteredUnits.length === 0 ? (
                <div className="p-8 text-center border border-stone-700/20 rounded border-dashed flex flex-col items-center justify-center text-stone-600">
                  <Signal className="w-8 h-8 mb-2 opacity-20" />
                  <span className="text-[10px] font-mono font-bold">NO ACTIVE SIGNALS</span>
                  <span className="text-[10px] font-mono opacity-50">WAITING FOR TELEMETRY</span>
                </div>
              ) : (
                filteredUnits.map(unit => (
                <div 
                  key={unit.id}
                  onClick={() => {
                    setSelectedUnitId(unit.id);
                    setActiveTab('intel'); // On mobile, switch to detail view
                  }}
                  className={`p-3 rounded border cursor-pointer transition-all hover:bg-stone-700/20 ${
                    selectedUnitId === unit.id 
                      ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_15px_rgba(234,88,12,0.1)]' 
                      : 'bg-[#1c1917] border-stone-700/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${unit.status === 'active' ? 'bg-green-600' : unit.status === 'distress' ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`} />
                      <span className="font-mono font-bold text-sm tracking-wide text-stone-200">{unit.callsign}</span>
                    </div>
                    <StatusBadge status={unit.status} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-stone-400">
                    <div className="flex items-center gap-1">
                      <Battery className="w-3 h-3" /> {unit.batteryLevel}%
                    </div>
                    <div className="flex items-center gap-1">
                      <Signal className="w-3 h-3" /> {unit.signalStrength}%
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-stone-500 truncate">
                    {unit.currentTask}
                  </div>
                </div>
              ))
              )}
            </div>
          </aside>
        )}

        {/* CENTER - MAP */}
        <section className={cn(
          "col-span-1 relative h-full w-full transition-all duration-300",
          isSidebarOpen ? "md:col-span-6 lg:col-span-7" : "md:col-span-9 lg:col-span-9"
        )}>
          <TacticalMap 
            units={filteredUnits} 
            incidents={filteredIncidents} 
            selectedUnitId={selectedUnitId}
            selectedIncidentId={selectedIncidentId}
            onUnitSelect={handleUnitSelect}
            onIncidentSelect={handleIncidentSelect}
          />
          
          {/* Map Overlay HUD Elements */}
          <div className="absolute top-4 left-4 pointer-events-none z-[400] hidden sm:flex flex-col gap-2">
             {!isSidebarOpen && (
               <button 
                 onClick={() => setIsSidebarOpen(true)}
                 className="pointer-events-auto bg-black/80 backdrop-blur-md border border-stone-700/30 p-2 rounded text-stone-400 hover:text-white hover:bg-stone-800 transition-colors w-fit"
                 title="Expand Sidebar"
               >
                 <ChevronRight className="w-5 h-5" />
               </button>
             )}
             <TacticalCard className="w-64 bg-black/80 backdrop-blur-md pointer-events-auto" title="SECTOR STATUS">
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <div className="text-zinc-500">THREAT LEVEL</div>
                    <div className="text-amber-400 font-bold text-lg">ELEVATED</div>
                  </div>
                  <div>
                    <div className="text-zinc-500">VISIBILITY</div>
                    <div className="text-emerald-400 font-bold text-lg">98%</div>
                  </div>
                </div>
             </TacticalCard>
          </div>

          {/* Filter Controls */}
          <div className="absolute top-4 right-4 z-[400] flex flex-col items-end gap-2 pointer-events-none">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`pointer-events-auto p-2 rounded border backdrop-blur-md transition-colors ${showFilters ? 'bg-orange-500 text-black border-orange-500' : 'bg-black/80 text-stone-400 border-stone-700/30 hover:bg-stone-800'}`}
            >
              <Filter className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="pointer-events-auto bg-black/90 border border-stone-700/30 rounded p-4 w-64 backdrop-blur-md shadow-xl"
                >
                  <h4 className="text-xs font-mono font-bold text-stone-500 mb-3 uppercase border-b border-stone-800 pb-2">Tactical Filters</h4>
                  
                  <div className="space-y-4">
                    {/* Unit Filters */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-orange-500 uppercase">Unit Type</label>
                      <select 
                        value={filterUnitType}
                        onChange={(e) => setFilterUnitType(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-700 rounded p-1.5 text-xs font-mono text-stone-300 focus:border-orange-500 outline-none"
                      >
                        <option value="all">ALL UNITS</option>
                        <option value="infantry">INFANTRY</option>
                        <option value="vehicle">VEHICLE</option>
                        <option value="drone">DRONE</option>
                        <option value="k9">K9 UNIT</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-orange-500 uppercase">Unit Status</label>
                      <select 
                        value={filterUnitStatus}
                        onChange={(e) => setFilterUnitStatus(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-700 rounded p-1.5 text-xs font-mono text-stone-300 focus:border-orange-500 outline-none"
                      >
                        <option value="all">ALL STATUSES</option>
                        <option value="active">ACTIVE</option>
                        <option value="idle">IDLE</option>
                        <option value="engaged">ENGAGED</option>
                        <option value="distress">DISTRESS</option>
                        <option value="offline">OFFLINE</option>
                      </select>
                    </div>

                    <div className="h-px bg-stone-800 my-2" />

                    {/* Incident Filters */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-red-500 uppercase">Incident Type</label>
                      <select 
                        value={filterIncidentType}
                        onChange={(e) => setFilterIncidentType(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-700 rounded p-1.5 text-xs font-mono text-stone-300 focus:border-red-500 outline-none"
                      >
                        <option value="all">ALL INCIDENTS</option>
                        <option value="hostile">HOSTILE</option>
                        <option value="medical">MEDICAL</option>
                        <option value="ied">IED</option>
                        <option value="civilian">CIVILIAN</option>
                        <option value="logistics">LOGISTICS</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-red-500 uppercase">Priority</label>
                      <select 
                        value={filterIncidentPriority}
                        onChange={(e) => setFilterIncidentPriority(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-700 rounded p-1.5 text-xs font-mono text-stone-300 focus:border-red-500 outline-none"
                      >
                        <option value="all">ALL PRIORITIES</option>
                        <option value="critical">CRITICAL</option>
                        <option value="high">HIGH</option>
                        <option value="medium">MEDIUM</option>
                        <option value="low">LOW</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* RIGHT SIDEBAR - INTEL & DETAILS */}
        <aside className={cn(
          "md:flex md:col-span-3 lg:col-span-3 flex-col border-l border-white/10 bg-[#09090b]/95 backdrop-blur z-20 absolute md:relative inset-0 md:inset-auto transition-transform duration-300",
          activeTab === 'intel' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        )}>
          
          {/* Selected Detail Panel (Unit OR Incident) */}
          <div className="h-1/2 border-b border-white/10 flex flex-col">
            <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Crosshair className="w-4 h-4" /> {selectedIncident ? 'INCIDENT DETAIL' : 'TARGET DETAIL'}
              </h3>
              {/* Close Button */}
              <button 
                className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                onClick={() => {
                  setActiveTab('map');
                  setSelectedUnitId(null);
                  setSelectedIncidentId(null);
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {selectedUnit ? (
              <div className="p-4 space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-mono font-bold text-white">{selectedUnit.callsign}</h2>
                  <StatusBadge status={selectedUnit.status} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-2 rounded border border-white/10">
                    <div className="text-[10px] text-zinc-500 uppercase">Type</div>
                    <div className="font-mono text-sm capitalize">{selectedUnit.type}</div>
                  </div>
                  <div className="bg-white/5 p-2 rounded border border-white/10">
                    <div className="text-[10px] text-zinc-500 uppercase">Personnel</div>
                    <div className="font-mono text-sm">{selectedUnit.members.length} PAX</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase">Current Tasking</div>
                  <div className="font-mono text-sm text-emerald-400 border-l-2 border-emerald-500 pl-2">
                    {selectedUnit.currentTask}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase">Telemetry</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="flex justify-between border-b border-white/10 pb-1">
                      <span>LAT</span> <span className="text-zinc-300">{selectedUnit.position.lat.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1">
                      <span>LNG</span> <span className="text-zinc-300">{selectedUnit.position.lng.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1">
                      <span>HDG</span> <span className="text-zinc-300">{selectedUnit.heading.toFixed(0)}°</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1">
                      <span>SPD</span> <span className="text-zinc-300">42 KM/H</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button 
                    disabled={true}
                    title="COMMS OFFLINE"
                    className="flex-1 font-bold py-2 rounded text-xs font-mono transition-colors flex items-center justify-center gap-2 bg-stone-800 text-stone-500 cursor-not-allowed"
                  >
                    <Lock className="w-3 h-3" /> COMMS
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded text-xs font-mono transition-colors border border-white/10">
                    TASK
                  </button>
                </div>

                {/* Drone Feed Placeholder */}
                {selectedUnit.type === 'drone' && (
                  <div className="mt-4 border border-white/10 rounded overflow-hidden relative">
                    <div className="bg-black/50 aspect-video flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-50 grayscale" />
                      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                      <div className="absolute top-2 left-2 text-[10px] font-mono text-emerald-500 bg-black/50 px-1">LIVE FEED // 4K</div>
                      <Crosshair className="w-8 h-8 text-white/50 absolute" />
                    </div>
                  </div>
                )}
              </div>
            ) : selectedIncident ? (
              <div className="p-4 space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-mono font-bold text-white">{selectedIncident.type.toUpperCase()}</h2>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${selectedIncident.priority === 'critical' ? 'bg-red-500 text-black' : 'bg-amber-500 text-black'}`}>
                    {selectedIncident.priority.toUpperCase()}
                  </span>
                </div>

                <div className="bg-white/5 p-3 rounded border border-white/10">
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">Description</div>
                  <div className="text-sm text-zinc-200 leading-relaxed">{selectedIncident.description}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] text-zinc-500 uppercase">Reported By</div>
                    <div className="font-mono text-sm text-emerald-400">{selectedIncident.reportedBy}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-zinc-500 uppercase">Timestamp</div>
                    <div className="font-mono text-sm text-zinc-400">{format(new Date(selectedIncident.timestamp), 'HH:mm:ss')}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase">Location</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="flex justify-between border-b border-white/10 pb-1">
                      <span>LAT</span> <span className="text-zinc-300">{selectedIncident.position.lat.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1">
                      <span>LNG</span> <span className="text-zinc-300">{selectedIncident.position.lng.toFixed(6)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={handleDispatch}
                    disabled={selectedIncident.status !== 'open'}
                    className={`flex-1 font-bold py-2 rounded text-xs font-mono transition-colors ${selectedIncident.status === 'open' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}
                  >
                    DISPATCH
                  </button>
                  <button 
                    onClick={handleResolve}
                    disabled={selectedIncident.status === 'resolved'}
                    className={`flex-1 font-bold py-2 rounded text-xs font-mono transition-colors ${selectedIncident.status !== 'resolved' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}
                  >
                    RESOLVE
                  </button>
                </div>
                
                <div className="flex gap-2 mt-2 pt-2 border-t border-white/10">
                  <button 
                    onClick={handleEditIncident}
                    className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-[10px] font-mono transition-colors bg-white/5 hover:bg-white/10 text-zinc-300"
                  >
                    EDIT
                  </button>
                  <button 
                    disabled={true}
                    className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-[10px] font-mono transition-colors bg-red-900/10 text-red-500/50 border border-red-900/10 cursor-not-allowed"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
                <Target className="w-12 h-12 mb-2 opacity-20" />
                <span className="font-mono text-xs">SELECT A UNIT OR INCIDENT</span>
              </div>
            )}
          </div>

          {/* Incident Feed */}
          <div className="h-1/2 flex flex-col bg-[#09090b] pb-20 md:pb-0">
            <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" /> INCIDENT FEED
              </h3>
              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 rounded border border-red-500/30">LIVE</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0">
              {isLoading ? (
                <div className="p-4 text-center space-y-2">
                  <div className="text-[10px] font-mono text-zinc-500 animate-pulse">SYNCING INTEL FEED...</div>
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center text-zinc-600 h-full">
                  <Shield className="w-8 h-8 mb-2 opacity-20" />
                  <span className="text-[10px] font-mono font-bold">NO ACTIVE THREATS</span>
                  <span className="text-[10px] font-mono opacity-50">SECTOR SECURE</span>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {/* ACTIVE SECTION */}
                  {filteredIncidents.filter(i => i.status !== 'resolved').length > 0 && (
                    <div className="bg-white/5 px-3 py-1 text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                      Active Operations
                    </div>
                  )}
                  {filteredIncidents.filter(i => i.status !== 'resolved').map(incident => (
                    <div 
                      key={incident.id} 
                      className={cn(
                        "p-3 hover:bg-white/5 transition-colors group relative",
                        selectedIncidentId === incident.id && "bg-white/5 border-l-2 border-red-500"
                      )}
                      onClick={() => handleIncidentSelect(incident.id)}
                    >
                      <div className="flex items-start gap-3">
                        <input 
                          type="checkbox" 
                          checked={false}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleIncidentStatus(incident.id, incident.status);
                          }}
                          className="mt-1 w-4 h-4 rounded border-white/10 bg-black text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-[10px] font-bold px-1 rounded ${incident.priority === 'critical' ? 'bg-red-500 text-black' : 'bg-amber-500 text-black'}`}>
                              {incident.priority.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">{format(new Date(incident.timestamp), 'HH:mm:ss')}</span>
                          </div>
                          <div className="text-sm font-bold text-zinc-200 mb-1">{incident.type.toUpperCase()}</div>
                          <div className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{incident.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* COMPLETED SECTION */}
                  {filteredIncidents.filter(i => i.status === 'resolved').length > 0 && (
                    <div className="bg-white/5 px-3 py-1 text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest mt-2">
                      Resolved / Completed
                    </div>
                  )}
                  {filteredIncidents.filter(i => i.status === 'resolved').map(incident => (
                    <div 
                      key={incident.id} 
                      className={cn(
                        "p-3 hover:bg-white/5 transition-colors group relative opacity-60",
                        selectedIncidentId === incident.id && "bg-white/5 border-l-2 border-zinc-500"
                      )}
                      onClick={() => handleIncidentSelect(incident.id)}
                    >
                      <div className="flex items-start gap-3">
                        <input 
                          type="checkbox" 
                          checked={true}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleIncidentStatus(incident.id, incident.status);
                          }}
                          className="mt-1 w-4 h-4 rounded border-white/10 bg-black text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold px-1 rounded bg-zinc-700 text-zinc-400">
                              RESOLVED
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">{format(new Date(incident.timestamp), 'HH:mm:ss')}</span>
                          </div>
                          <div className="text-sm font-bold text-zinc-500 mb-1 line-through">{incident.type.toUpperCase()}</div>
                          <div className="text-xs text-zinc-600 leading-relaxed line-through line-clamp-1">{incident.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

      </main>

      {/* DESKTOP FOOTER STATUS */}
      <footer className="hidden md:flex h-6 bg-[#09090b] border-t border-white/10 items-center justify-between px-4 text-[10px] font-mono text-zinc-500 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            NETWORK: SATCOM-LINK-1 [SECURE]
          </span>
          <span>LATENCY: 42ms</span>
          <span>UPTIME: 14:22:09</span>
        </div>
        <div className="flex items-center gap-4">
          <span>ENCRYPTION: ACTIVE</span>
          <span>DATABASE: CONNECTED</span>
          <span>VERSION: 5.0.1-MIL</span>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#18181b] border-t border-white/10 flex items-center justify-around z-50 pb-safe">
        <button 
          onClick={() => setActiveTab('units')}
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'units' ? 'text-emerald-400' : 'text-zinc-500'}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-mono font-bold">UNITS</span>
        </button>
        <button 
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'map' ? 'text-emerald-400' : 'text-zinc-500'}`}
        >
          <MapIcon className="w-5 h-5" />
          <span className="text-[10px] font-mono font-bold">MAP</span>
        </button>
        <button 
          onClick={() => setActiveTab('intel')}
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'intel' ? 'text-emerald-400' : 'text-zinc-500'}`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] font-mono font-bold">INTEL</span>
        </button>
      </nav>

      {/* INCIDENT REPORT MODAL */}
      <AnimatePresence>
        {showIncidentModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#18181b] border border-white/10 rounded-lg shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-mono font-bold text-white flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-red-500" /> {editingIncident ? 'EDIT INCIDENT' : 'REPORT INCIDENT'}
                </h3>
                <button onClick={() => { setShowIncidentModal(false); setEditingIncident(null); }} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleReportIncident} className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">INCIDENT TYPE</label>
                  <select name="type" defaultValue={editingIncident?.type} className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none">
                    <option value="hostile">HOSTILE ACTIVITY</option>
                    <option value="medical">MEDICAL EMERGENCY</option>
                    <option value="ied">IED / EXPLOSIVE</option>
                    <option value="civilian">CIVILIAN INTERACTION</option>
                    <option value="logistics">LOGISTICS / SUPPLY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">PRIORITY LEVEL</label>
                  <select name="priority" defaultValue={editingIncident?.priority} className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none">
                    <option value="low">LOW</option>
                    <option value="medium">MEDIUM</option>
                    <option value="high">HIGH</option>
                    <option value="critical">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">DESCRIPTION</label>
                  <textarea 
                    name="description" 
                    defaultValue={editingIncident?.description}
                    rows={3}
                    className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none resize-none"
                    placeholder="Enter tactical details..."
                    required
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setShowIncidentModal(false); setEditingIncident(null); }}
                    className="flex-1 py-2 border border-white/10 rounded text-xs font-mono font-bold hover:bg-white/5 transition-colors"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2 bg-red-600 hover:bg-red-500 rounded text-xs font-mono font-bold text-white transition-colors"
                  >
                    {editingIncident ? 'UPDATE RECORD' : 'TRANSMIT REPORT'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANUAL MODAL */}
      <AnimatePresence>
        {isManualOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#18181b] border border-white/10 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-mono font-bold text-white flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-orange-500" /> TACTICAL USER MANUAL
                </h3>
                <button onClick={() => setIsManualOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto prose prose-invert prose-stone max-w-none font-mono text-sm">
                <div className="markdown-body">
                  <Markdown>{`
# Tactical Command & Control - User Manual

## 1. Authentication & Onboarding Workflow

The system uses a hierarchical approval process to ensure secure access.

### Step 1: Secure Handshake (Login)
*   **Google Login:** Recommended for most users. Click "LOGIN WITH GOOGLE".
*   **Tactical Login:** Use your assigned username and password if provided by your command.

### Step 2: Role-Based Setup
After your first login, you must define your role in the ecosystem:

#### A. HQ Operator (Command Staff)
*   **Action:** Select "REGISTER NEW HQ".
*   **Details:** Provide the HQ Name (e.g., "Sector 7 Command") and Location.
*   **Approval:** Your HQ registration will be sent to the **Super Admin** for authorization. You will see a "PENDING AUTHORIZATION" screen until approved.

#### B. Patrol User (Field Staff)
*   **Action:** Select "JOIN EXISTING HQ".
*   **Details:** Choose the appropriate HQ from the list of registered commands.
*   **Approval:** Your join request will be sent to that specific **HQ Operator** for authorization. You will see a "WAITING FOR HQ APPROVAL" screen until the operator clears you.

---

## 2. Command Center Operations (Operators)

Once authorized, Operators gain access to the full Command Center suite.

### Tactical Map
*   **Real-Time Tracking:** Units appear as icons. Click a unit to see its movement trail and vital signs.
*   **Map Layers:** Use the layer icon to switch between Tactical (Dark), Satellite, and Terrain views.
*   **Incident Markers:** Hostile, Medical, and Security incidents appear as red/orange icons.

### Unit Management
*   **Sidebar:** View all active units assigned to your HQ.
*   **Status Indicators:** Monitor battery levels, signal strength, and current tasks.
*   **Intel Panel:** Click any unit to view detailed telemetry and history.

### Incident Response
*   **Reporting:** Click "REPORT INCIDENT" to mark a new event on the map.
*   **Management:** Click an incident to update its status (Open -> Investigating -> Resolved).
*   **Dispatch:** Assign units to specific incidents to coordinate response.

---

## 3. Field Operations (Patrol Users)

Patrol Users primarily interact with the system via the Tactical Map and self-tracking.

### Self-Tracking
*   **Track Device:** Click "TRACK DEVICE" in the header.
*   **Permission:** Allow location access. Your device will now appear on the HQ's map in real-time.
*   **Follow Me:** Enable "FOLLOW ME" to keep the map centered on your current position.

### Field Reporting
*   **Quick Report:** Use the "REPORT" button to notify HQ of immediate threats or status changes.
*   **Intel Access:** View other incidents reported in your sector to maintain situational awareness.

---

## 4. Troubleshooting

*   **"Pending Authorization":** Contact the Super Admin to approve your Operator account.
*   **"Waiting for HQ Approval":** Contact your local HQ Operator to approve your join request.
*   **Location Issues:** Ensure GPS is enabled and the browser has permission to access location data.
*   **Connection Lost:** The system will attempt to reconnect automatically. Check your data/Wi-Fi signal.
`}</Markdown>
                </div>
              </div>

              <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
                <button 
                  onClick={() => setIsManualOpen(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded text-xs font-mono font-bold transition-colors"
                >
                  CLOSE MANUAL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
