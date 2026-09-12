import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { ChemLab } from "@/components/vault/ChemLab";
import { ArrowLeft, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-x-clip p-6">
      <ChemLab />
      <div className="modal-enter glass w-full max-w-sm rounded-[1.5rem] p-7 shadow-[0_40px_90px_-20px_rgb(0_0_0/0.7)]">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
          <FlaskConical className="size-3.5" />
          ChemVault 10
        </div>
        <h1 className="font-display text-3xl text-fg">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Sync stars, mastery and quiz streaks across devices. Gate viewers are signed in
          automatically.
        </p>
        <div className="mt-6 grid gap-2.5">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                className="btn btn-ghost h-12 rounded-2xl"
              >
                Continue with {p.label}
              </button>
            ))
          ) : (
            <p className="text-sm text-muted">Sign-in is disabled.</p>
          )}
        </div>
        <div className="hairline my-6" />
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-3.5" />
          Back to the vault
        </Link>
      </div>
    </main>
  );
}
