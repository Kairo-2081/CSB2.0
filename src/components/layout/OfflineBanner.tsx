import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** A strip across the top while the browser reports no connection. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && navigator.onLine === false);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;
  return (
    <div role="status" className="animate-enter sticky top-0 z-40 flex items-center justify-center gap-2 border-b border-warning/30 bg-warning/15 px-4 py-2.5 text-sm text-warning backdrop-blur">
      <WifiOff aria-hidden="true" className="h-4 w-4" />
      You're offline. Lists won't refresh and posts won't send until you're back.
    </div>
  );
}
