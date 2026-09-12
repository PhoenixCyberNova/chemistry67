import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function PwaRegister() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => undefined);
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return (
    <>
      {offline ? (
        <span className="hidden h-11 items-center rounded-xl border border-border px-3 text-xs font-medium text-muted sm:inline-flex">
          Offline pack ready
        </span>
      ) : null}
      <a
        href="?install=1"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted hover:text-fg"
        aria-label="Install ChemVault"
        title="Install as an app"
      >
        <Download className="size-4" />
      </a>
    </>
  );
}
