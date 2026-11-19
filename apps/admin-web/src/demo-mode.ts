const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

export const isVercelPreviewDemoMode = import.meta.env.VITE_PREVIEW_DEMO_MODE === 'true';

export const isLocalDemoMode =
  import.meta.env.DEV ||
  isVercelPreviewDemoMode ||
  (import.meta.env.VITE_LOCAL_DEMO_MODE === 'true' &&
    typeof window !== 'undefined' &&
    LOCAL_HOSTNAMES.has(window.location.hostname));
