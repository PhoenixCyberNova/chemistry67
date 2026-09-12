import { createFileRoute } from "@tanstack/react-router";
import { VaultApp } from "@/components/vault/VaultApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <VaultApp />;
}
