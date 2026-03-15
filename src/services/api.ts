import { PatrolUnit, Incident, User } from '@/types';
import { API_BASE_URL as BASE_URL } from '@/constants';

const getUrl = (path: string) => `${BASE_URL}${path}`;

export const api = {
  async getUnits(): Promise<PatrolUnit[]> {
    const res = await fetch(getUrl('/api/units'));
    if (!res.ok) throw new Error('Failed to fetch units');
    return res.json();
  },

  async getIncidents(): Promise<Incident[]> {
    const res = await fetch(getUrl('/api/incidents'));
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async reportIncident(incident: Incident): Promise<void> {
    const res = await fetch(getUrl('/api/incidents'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident),
    });
    if (!res.ok) throw new Error('Failed to report incident');
  },

  async updateIncidentStatus(id: string, status: Incident['status']): Promise<void> {
    return this.updateIncident(id, { status });
  },

  async updateIncident(id: string, updates: Partial<Incident>): Promise<void> {
    const res = await fetch(getUrl(`/api/incidents/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update incident');
  },

  async deleteIncident(id: string): Promise<void> {
    const res = await fetch(getUrl(`/api/incidents/${id}`), {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete incident');
  },

  async getSettings(): Promise<{ install_date: string, tier: string, expiry_date: string }> {
    const res = await fetch(getUrl('/api/settings'));
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async upgradeTier(tier: 'basic' | 'premium'): Promise<void> {
    const res = await fetch(getUrl('/api/settings/upgrade'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    });
    if (!res.ok) throw new Error('Failed to upgrade');
  },

  async extendTime(days: number): Promise<void> {
    const res = await fetch(getUrl('/api/settings/extend'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days }),
    });
    if (!res.ok) throw new Error('Failed to extend time');
  },

  async resetSystem(): Promise<void> {
    const res = await fetch(getUrl('/api/admin/reset'), { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset system');
  },

  // --- NEW AUTH & ADMIN FUNCTIONS ---
  async getGoogleAuthUrl(): Promise<string> {
    const res = await fetch(getUrl('/api/auth/google/url'));
    const data = await res.json();
    return data.url;
  },

  async verifyToken(): Promise<User | null> {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const res = await fetch(getUrl('/api/auth/verify'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        localStorage.removeItem('token');
        return null;
      }
      const data = await res.json();
      return data.user;
    } catch (e) {
      localStorage.removeItem('token');
      return null;
    }
  },

  async getAdminUsers(): Promise<any[]> {
    const token = localStorage.getItem('token');
    const res = await fetch(getUrl('/api/admin/users'), {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  async approveUser(id: string, role: string, hqId: string): Promise<void> {
    const token = localStorage.getItem('token');
    const res = await fetch(getUrl(`/api/admin/users/${id}/approve`), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ role, hqId })
    });
    if (!res.ok) throw new Error('Failed to approve user');
  },

  async getHQs(): Promise<any[]> {
    const token = localStorage.getItem('token');
    const res = await fetch(getUrl('/api/hqs'), {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  async registerHQ(data: { name: string, location: string, additionalDetails: string }): Promise<{ hqId: string }> {
    const token = localStorage.getItem('token');
    const res = await fetch(getUrl('/api/hqs/register'), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to register HQ');
    return res.json();
  },

  async requestJoinHQ(hqId: string): Promise<void> {
    const token = localStorage.getItem('token');
    const res = await fetch(getUrl('/api/users/join-request'), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ hqId })
    });
    if (!res.ok) throw new Error('Failed to request join');
  },

  async createSession(hqId: string): Promise<{ sessionId: string }> {
    const token = localStorage.getItem('token');
    const res = await fetch(getUrl('/api/operator/sessions'), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ hqId })
    });
    return res.json();
  },

  async registerUnit(id: string, data: Partial<PatrolUnit>): Promise<void> {
    const payload: any = { ...data };
    if (data.position) {
      payload.lat = data.position.lat;
      payload.lng = data.position.lng;
    }
    const res = await fetch(getUrl(`/api/units/${id}/telemetry`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to register/update unit');
  },
  
  // Debug/Sim function to move units randomly on server (optional)
  async simulateTelemetry(unitId: string, data: Partial<PatrolUnit>) {
    const payload: any = { ...data };
    if (data.position) {
      payload.lat = data.position.lat;
      payload.lng = data.position.lng;
    }
    
    await fetch(getUrl(`/api/units/${unitId}/telemetry`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
};
