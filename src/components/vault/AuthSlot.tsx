import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Link } from "@tanstack/react-router";

export function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="size-10 shrink-0 animate-pulse rounded-xl bg-raised" aria-hidden />;
  }
  if (user) {
    return (
      <div className="min-w-0 max-w-[42vw] overflow-hidden sm:max-w-none">
        <UserButton />
      </div>
    );
  }
  return (
    <Link
      to="/login"
      className="btn btn-ghost h-10 shrink-0 rounded-xl px-3.5 text-xs"
    >
      Sign in
    </Link>
  );
}
