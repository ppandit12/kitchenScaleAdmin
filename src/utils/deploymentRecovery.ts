// Refresh an outdated tab once per entry bundle, without causing a reload loop.
export function installDeploymentRecovery(build: string) {
  window.addEventListener('vite:preloadError', event => {
    if (!navigator.onLine) return;
    try {
      const key = 'ksc:deployment-recovery';
      if (sessionStorage.getItem(key) === build) return;
      sessionStorage.setItem(key, build);
    } catch { return; }
    event.preventDefault();
    window.location.reload();
  });
}
