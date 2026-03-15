export type UnitStatus = 'active' | 'idle' | 'offline' | 'distress' | 'engaged';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PatrolUnit {
  id: string;
  callsign: string;
  type: 'infantry' | 'vehicle' | 'drone' | 'k9';
  status: UnitStatus;
  position: Coordinates;
  heading: number; // 0-360
  batteryLevel: number; // 0-100
  signalStrength: number; // 0-100
  lastUpdate: string;
  members: string[];
  currentTask?: string;
  path?: Coordinates[];
}

export interface Incident {
  id: string;
  type: 'hostile' | 'medical' | 'ied' | 'civilian' | 'logistics';
  priority: 'low' | 'medium' | 'high' | 'critical';
  position: Coordinates;
  timestamp: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved';
  reportedBy: string;
}

export interface SystemAlert {
  id: string;
  level: 'info' | 'warning' | 'critical' | 'success';
  message: string;
  timestamp: string;
}

export type UserRole = 'super_admin' | 'hq_control' | 'operator' | 'patrol_user';

export interface User {
  id: string;
  username?: string;
  email?: string;
  role: UserRole;
  isApproved: boolean;
  hqId?: string;
  status: 'pending' | 'active' | 'suspended';
}

export interface HQ {
  id: string;
  name: string;
  location?: string;
  createdAt: string;
}
