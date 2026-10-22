import { createFileRoute } from "@tanstack/react-router"
import { AccountSpace } from "../components/account-space"
import { requireSession } from "../lib/require-session"

export const Route = createFileRoute("/feedback")({
  ssr: false,
  beforeLoad: () => requireSession("/feedback"),
  component: () => <AccountSpace founder={false} />,
})
