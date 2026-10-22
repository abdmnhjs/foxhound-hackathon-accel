import { createFileRoute } from "@tanstack/react-router"
import { AccountSpace } from "../components/account-space"
import { requireSession } from "../lib/require-session"

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: () => requireSession("/dashboard"),
  component: () => <AccountSpace founder />,
})
