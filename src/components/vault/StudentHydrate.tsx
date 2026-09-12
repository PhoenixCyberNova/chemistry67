import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useStudent } from "@/lib/student/store";
import { loadStudentState, saveStudentState } from "@/lib/student/sync";
import { useEffect, useRef } from "react";

export function StudentHydrate() {
  const { user, isPending } = useCurrentUserState();
  const theme = useStudent((s) => s.theme);
  const updatedAt = useStudent((s) => s.updatedAt);
  const applyRemote = useStudent((s) => s.applyRemote);
  const booted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve(useStudent.persist.rehydrate()).then(() => {
      if (cancelled) return;
      useStudent.getState().markHydrated();
      const t = useStudent.getState().theme;
      document.documentElement.classList.toggle("light", t === "light");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  useEffect(() => {
    if (isPending || !user) return;
    void loadStudentState()
      .then((res) => {
        if (res.ok) applyRemote(res.payload);
      })
      .catch(() => undefined);
  }, [user, isPending, applyRemote]);

  useEffect(() => {
    if (isPending || !user) return;
    if (!booted.current) {
      booted.current = true;
      return;
    }
    if (!updatedAt) return;
    const handle = window.setTimeout(() => {
      const payload = useStudent.getState().snapshot();
      void saveStudentState({ data: { payload } }).catch(() => undefined);
    }, 900);
    return () => window.clearTimeout(handle);
  }, [updatedAt, user, isPending]);

  return null;
}
