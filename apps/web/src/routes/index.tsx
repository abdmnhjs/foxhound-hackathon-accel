import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import type { FormEvent } from "react"
import { ArrowRight, LockKeyhole } from "lucide-react"
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
    <main className="grid min-h-svh bg-stone-50 lg:grid-cols-2">
      <section className="flex flex-col justify-between bg-slate-950 p-8 text-white lg:p-16">
        <a href="/" className="text-xl font-bold tracking-tight">
          foxhound<span className="text-lime-300">.</span>
        </a>
        <div className="py-12 lg:py-24">
          <span className="text-xs font-semibold tracking-widest text-lime-300 uppercase">
            Your collaboration space
          </span>
          <h1 className="mt-6 max-w-lg text-4xl leading-tight font-semibold lg:text-6xl">
            Great ideas start with a conversation.
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-slate-400">
            Share feedback and build what comes next, together.
          </p>
        </div>
        <p className="text-sm text-slate-500">
          Foxhound · From feedback to action.
        </p>
      </section>
      <section className="flex items-center justify-center px-6 py-14 lg:p-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border bg-white">
            <LockKeyhole size={22} />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">Welcome</h2>
          <p className="mt-3 text-sm text-stone-500">
            Sign in to access your workspace.
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
                className="mt-2 h-12 w-full rounded-xl border bg-white px-4 outline-none focus:ring-2 focus:ring-slate-900"
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
                className="mt-2 h-12 w-full rounded-xl border bg-white px-4 outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              disabled={pending}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-slate-950 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {pending ? "Signing in…" : "Sign in"}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
