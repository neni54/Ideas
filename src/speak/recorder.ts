// SIDEYE SPEAK · "Grabarme y comparar": records the person for a few seconds so they can hear
// themselves right after the model voice. The audio stays in memory on the device: it is never
// uploaded or saved, and it is discarded when the next phrase starts (or the screen closes).

export const canRecord = () =>
  typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder !== 'undefined';

export interface Recording {
  stop: () => void;
  /** Resolves with a temporary blob URL (revoke it with discard()). */
  done: Promise<string>;
}

const MIMES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/aac'];

export function record(maxMs = 8000): Recording {
  let stopFn = () => undefined as void;
  const done = (async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const mime = MIMES.find((m) => MediaRecorder.isTypeSupported?.(m));
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const finished = new Promise<string>((resolve, reject) => {
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop()); // release the microphone immediately
        if (!chunks.length) return reject(new Error('empty'));
        resolve(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || mime || 'audio/mp4' })));
      };
    });
    const cap = setTimeout(() => rec.state !== 'inactive' && rec.stop(), maxMs);
    stopFn = () => {
      clearTimeout(cap);
      if (rec.state !== 'inactive') rec.stop();
    };
    rec.start();
    return finished;
  })();
  return { stop: () => stopFn(), done };
}

let current: HTMLAudioElement | null = null;
export function playUrl(url: string): Promise<void> {
  current?.pause();
  const a = new Audio(url);
  current = a;
  return new Promise((resolve) => {
    a.onended = () => resolve();
    a.onerror = () => resolve();
    a.play().catch(() => resolve());
  });
}
export function stopPlayback() {
  current?.pause();
}
export function discard(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}
