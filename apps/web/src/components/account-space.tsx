import { useState } from "react"
import axios from "axios"
import type { FormEvent } from "react"
import { useNavigate } from "@tanstack/react-router"
import { authRequest } from "../lib/auth"
import { FounderFeedback } from "./founder-feedback"

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
  return (
    <main className="min-h-svh bg-white text-foreground">
      <section
        className={`mx-auto px-5 py-8 sm:px-8 sm:py-12 ${founder ? "max-w-4xl" : "max-w-2xl"}`}
      >
        <div className="mb-10 flex flex-wrap items-center justify-end gap-4 sm:mb-12">
          <div className="flex items-center gap-5">
            <span className="text-sm text-muted-foreground">
              {founder ? "Founder" : "User"}
            </span>
            <button
              onClick={logout}
              disabled={pending}
              className="min-h-10 rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              {pending ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="mb-6 text-red-700">
            {error}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight">
          {founder ? "Dashboard" : "Share your feedback"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {founder
            ? "What matters most to your users, in one place."
            : "Tell us what works, what doesn't, or what you'd like next."}
        </p>
        <div
          className={
            founder ? "mt-8" : "mt-8 rounded-lg border bg-white p-5 sm:p-6"
          }
        >
          {founder && <FounderFeedback />}
          {!founder && (
            <form onSubmit={submitFeedback} className="space-y-5">
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
                  className="mt-2 w-full resize-y rounded-lg border bg-white px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={feedbackPending}
                className="min-h-11 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
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
