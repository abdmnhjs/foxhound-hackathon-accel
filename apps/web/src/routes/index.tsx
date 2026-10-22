import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import type { FormEvent } from "react"
import { authRequest, destination } from "../lib/auth"
import type { Session } from "../lib/auth"

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const session = await authRequest<Session | null>("get-session")
    const to = session && destination(session)
    if (to) throw redirect({ to })
  },
  pendingComponent: () => <p className="p-8">Loading…</p>,
  errorComponent: () => (
    <main className="p-8">
      <p>The server is unavailable.</p>
      <button
        className="mt-4 underline"
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
    </main>
  ),
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const data = new FormData(event.currentTarget)
    const username = String(data.get("username")).trim().toLowerCase()
    if (!["user", "founder"].includes(username)) {
      setError("Incorrect username or password.")
      return
    }
    setPending(true)
    try {
      const session = await authRequest<Session>("sign-in/email", {
        email: `${username}@foxhound.test`,
        password: String(data.get("password")),
      })
      const to = destination(session)
      if (!to)
        throw new Error("This account does not have access to a workspace.")
      await navigate({ to, replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.")
    } finally {
      setPending(false)
    }
  }
  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b bg-white px-6 py-5 sm:px-10">
        <a href="/" className="text-xl font-bold tracking-tight">
          foxhound<span className="text-primary">.</span>
        </a>
      </header>
      <section className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm rounded-lg border bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your workspace.
          </p>
          <form onSubmit={submit} className="mt-9 space-y-5">
            <div>
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                name="username"
                autoComplete="username"
                required
                placeholder="Your username"
                className="mt-2 h-11 w-full rounded-lg border bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-2 h-11 w-full rounded-lg border bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              disabled={pending}
              className="h-11 w-full rounded-full bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
