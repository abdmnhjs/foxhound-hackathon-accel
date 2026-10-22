import { redirect } from "@tanstack/react-router"
import { authRequest, destination } from "./auth"
import type { Session } from "./auth"

export async function requireSession(path: "/feedback" | "/dashboard") {
  const session = await authRequest<Session | null>("get-session")
  const to = session && destination(session)
  if (!to) throw redirect({ to: "/" })
  if (to !== path) throw redirect({ to })
}
