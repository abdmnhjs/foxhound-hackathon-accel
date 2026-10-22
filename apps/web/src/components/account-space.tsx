import { useState } from "react"
import axios from "axios"
import type { FormEvent } from "react"
import { useNavigate } from "@tanstack/react-router"
import { LogOut, MessageSquare, LayoutDashboard } from "lucide-react"
import { authRequest } from "../lib/auth"

export function AccountSpace({ founder }: { founder: boolean }) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [feedbackPending, setFeedbackPending] = useState(false)
  const [feedbackError, setFeedbackError] = useState("")
  const [feedbackSent, setFeedbackSent] = useState(false)
  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (feedbackPending) return
    const form = event.currentTarget
    const text = String(new FormData(form).get("feedback") ?? "").trim()
    setFeedbackError("")
    setFeedbackSent(false)
    if (!text) {
      setFeedbackError("Please enter your feedback.")
      return
    }
    setFeedbackPending(true)
    try {
      await axios.post("/api/feedback", { text }, { withCredentials: true })
      form.reset()
      setFeedbackSent(true)
    } catch (cause) {
      setFeedbackError(
        axios.isAxiosError(cause) && cause.response?.status === 401
          ? "Please sign in again to send feedback."
          : "Unable to send feedback. Please try again."
      )
    } finally {
      setFeedbackPending(false)
    }
  }
  async function logout() {
    setPending(true)
    setError("")
    try {
      await authRequest("sign-out", {})
      await navigate({ to: "/", replace: true })
    } catch {
      setError("Unable to sign out. Please try again.")
    } finally {
      setPending(false)
    }
  }
  const Icon = founder ? LayoutDashboard : MessageSquare
  return (
    <main className="min-h-svh bg-stone-50 text-slate-950">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-white px-6 py-5 lg:px-12">
        <a href="/" className="text-xl font-bold">
          foxhound.
        </a>
        <div className="flex items-center gap-5">
          <span className="text-sm text-stone-500">
            {founder ? "founder" : "user"}
          </span>
          <button
            onClick={logout}
            disabled={pending}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-stone-50 disabled:opacity-50"
          >
            <LogOut size={16} />
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-16">
        {error && (
          <p role="alert" className="mb-6 text-red-700">
            {error}
          </p>
        )}
        <span className="text-xs font-semibold tracking-widest text-stone-500 uppercase">
          {founder ? "Founder" : "User"} workspace
        </span>
        <h1 className="mt-3 text-4xl font-semibold">
          {founder ? "Dashboard" : "Feedback"}
        </h1>
        <p className="mt-4 text-stone-500">
          {founder
            ? "Welcome to your dashboard."
            : "Welcome to your feedback workspace."}
        </p>
        <div className="mt-10 rounded-2xl border bg-white p-10">
          <Icon className="mb-5 text-stone-400" size={28} />
          <h2 className="text-lg font-medium">
            {founder ? "It all starts with an idea." : "Your feedback matters."}
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            {founder
              ? "Your users? feedback will appear here."
              : "Your conversations and feedback will appear here."}
          </p>
          {!founder && (
            <form onSubmit={submitFeedback} className="mt-6 space-y-4">
              <div>
                <label htmlFor="feedback" className="text-sm font-medium">
                  Your feedback
                </label>
                <textarea
                  id="feedback"
                  name="feedback"
                  rows={6}
                  required
                  disabled={feedbackPending}
                  placeholder="Share your thoughts or suggestions..."
                  className="mt-2 w-full resize-y rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <button
                type="submit"
                disabled={feedbackPending}
                className="rounded-xl bg-slate-950 px-6 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {feedbackPending ? "Sending..." : "Send feedback"}
              </button>
              {feedbackError && (
                <p role="alert" className="text-sm text-red-700">
                  {feedbackError}
                </p>
              )}
              {feedbackSent && (
                <p role="status" className="text-sm text-green-700">
                  Your feedback has been sent.
                </p>
              )}
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
