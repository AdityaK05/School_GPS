const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

export const isLocalDemoMode =
  import.meta.env.DEV ||
  (import.meta.env.VITE_LOCAL_DEMO_MODE === 'true' &&
    typeof window !== 'undefined' &&
    LOCAL_HOSTNAMES.has(window.location.hostname));
