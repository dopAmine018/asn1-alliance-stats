import { createClient } from '@supabase/supabase-js';
import { AuditLog } from '../types';

const PROVIDED_URL = "https://fgrzuylyxfogejwmeakn.supabase.co";
const PROVIDED_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncnp1eWx5eGZvZ2Vqd21lYWtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEyNjEyNCwiZXhwIjoyMDgwNzAyMTI0fQ.3G3BaSOg6uzN_zn7Wf1Ebn4TjAeXsvKGBJO4STzsu8c";

const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) return import.meta.env[key];
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  } catch (e) {}
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || PROVIDED_URL;
const supabaseKey = getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || PROVIDED_KEY;

const supabase = createClient(supabaseUrl.trim(), supabaseKey.trim(), {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const STORAGE_KEY = 'asn1_audit_logs';

// Cached location info
let cachedIpInfo: { ip: string; location: string } | null = null;

// Get browser metadata
export function getBrowserDetails(): { userAgent: string; location: string } {
  let browser = 'Unknown Browser';
  const ua = navigator.userAgent;

  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/')) browser = 'Safari';

  let os = 'Unknown OS';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'GMT';

  return {
    userAgent: `${browser} / ${os}`,
    location: tz
  };
}

// Fetch IP address and location asynchronously
export async function getIpAndLocation(): Promise<{ ip: string; location: string }> {
  if (cachedIpInfo) return cachedIpInfo;

  const browserMeta = getBrowserDetails();
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      cachedIpInfo = {
        ip: data.ip || '127.0.0.1',
        location: `${data.city || 'Unknown'}, ${data.country_name || 'Global'} (${data.ip})`
      };
      return cachedIpInfo;
    }
  } catch (e) {
    // Fallback to simple IP service if ipapi is rate-limited
    try {
      const res2 = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
      if (res2.ok) {
        const data2 = await res2.json();
        cachedIpInfo = {
          ip: data2.ip || 'Local Network',
          location: `${browserMeta.location} (${data2.ip})`
        };
        return cachedIpInfo;
      }
    } catch (err) {}
  }

  cachedIpInfo = {
    ip: 'Session IP',
    location: `${browserMeta.location}`
  };
  return cachedIpInfo;
}

// Read local logs
function getLocalLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Save local logs
function saveLocalLogs(logs: AuditLog[]) {
  try {
    // Keep max 500 logs locally
    const trimmed = logs.slice(0, 500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {}
}

// Subscribers for live UI updates
type LogListener = (logs: AuditLog[]) => void;
const listeners = new Set<LogListener>();

export function subscribeToLogs(listener: LogListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(logs: AuditLog[]) {
  listeners.forEach(fn => fn(logs));
}

export const AuditLogger = {
  // Main log function
  log: async (
    category: AuditLog['category'],
    action: string,
    actor: string = 'System User',
    details?: Record<string, any>
  ): Promise<AuditLog> => {
    const browserMeta = getBrowserDetails();
    const ipMeta = await getIpAndLocation();

    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      actor,
      category,
      action,
      ipAddress: ipMeta.ip,
      location: ipMeta.location,
      userAgent: browserMeta.userAgent,
      details
    };

    // Save to LocalStorage first
    const current = getLocalLogs();
    const updated = [newLog, ...current];
    saveLocalLogs(updated);
    notifyListeners(updated);

    // Save to Supabase audit_logs table asynchronously
    try {
      await supabase.from('audit_logs').insert({
        id: newLog.id,
        created_at: newLog.createdAt,
        actor: newLog.actor,
        category: newLog.category,
        action: newLog.action,
        ip_address: newLog.ipAddress,
        location: newLog.location,
        user_agent: newLog.userAgent,
        details: newLog.details || {}
      });
    } catch (e) {
      // Supabase insertion optional/fallback
    }

    return newLog;
  },

  // Get all logs from Supabase + local
  getLogs: async (): Promise<AuditLog[]> => {
    const local = getLocalLogs();
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!error && data && data.length > 0) {
        const remoteLogs: AuditLog[] = data.map((r: any) => ({
          id: r.id,
          createdAt: r.created_at,
          actor: r.actor || 'System',
          category: r.category || 'SYSTEM',
          action: r.action || 'Action Executed',
          ipAddress: r.ip_address || 'Unknown IP',
          location: r.location || 'Unknown Location',
          userAgent: r.user_agent || 'Unknown Browser',
          details: r.details || {}
        }));

        // Merge remote and local (de-duplicate by ID)
        const map = new Map<string, AuditLog>();
        [...remoteLogs, ...local].forEach(item => {
          if (!map.has(item.id)) map.set(item.id, item);
        });

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        saveLocalLogs(merged);
        return merged;
      }
    } catch (e) {}

    return local;
  },

  // Clear all logs
  clearLogs: async (): Promise<void> => {
    localStorage.removeItem(STORAGE_KEY);
    notifyListeners([]);
    try {
      await supabase.from('audit_logs').delete().neq('id', 'keep');
    } catch (e) {}
  }
};
