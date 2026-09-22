/**
 * Utilitas real-time synchronization lintas-tab & browser
 * Menggunakan BroadcastChannel API (dengan fallback localStorage) untuk sinkronisasi sub-milidetik
 * antar tab, serta event dispatcher untuk komponen aplikasi.
 */

const CHANNEL_NAME = 'psdm_realtime_sync_channel';

export type RealtimeEventType =
  | 'ATTENDANCE_CHANGED'
  | 'PERMISSION_CHANGED'
  | 'ACTIVITY_CHANGED'
  | 'MASTER_DATA_CHANGED'
  | 'FORCE_SYNC';

export interface RealtimeMessage {
  type: RealtimeEventType;
  timestamp: number;
  payload?: unknown;
}

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  // BroadcastChannel tidak didukung di lingkungan tertentu
}

/**
 * Mengirimkan event mutasi real-time ke seluruh tab lain yang sedang terbuka
 */
export function broadcastRealtimeEvent(type: RealtimeEventType, payload?: unknown): void {
  const message: RealtimeMessage = {
    type,
    timestamp: Date.now(),
    payload,
  };

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(message);
    } catch {
      // Abaikan error posting message
    }
  }

  // Fallback melalui localStorage event untuk browser lawas
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('psdm_realtime_event_ping', `${type}_${Date.now()}`);
    }
  } catch {
    // Abaikan restricted storage error
  }
}

/**
 * Berlangganan event real-time dari tab lain
 */
export function subscribeRealtimeEvents(onEvent: (msg: RealtimeMessage) => void): () => void {
  const handleBroadcast = (event: MessageEvent<RealtimeMessage>) => {
    if (event && event.data && event.data.type) {
      onEvent(event.data);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'psdm_realtime_event_ping' && e.newValue) {
      const parts = e.newValue.split('_');
      const type = parts[0] as RealtimeEventType;
      onEvent({
        type,
        timestamp: Date.now(),
      });
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}
