import { useEffect, useState } from "react"
import axios from "axios"

type FeedbackResult = {
  id: string
  title: string
  summary: string
  score: number
  priority: "red" | "yellow" | "green"
  contradiction: string | null
  createdAt: string
}

export function FounderFeedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError("")
    axios
      .get<FeedbackResult[]>("/api/feedback/results", {
        withCredentials: true,
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!controller.signal.aborted) setFeedbacks(data)
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setError(
          axios.isAxiosError(cause) &&
            [401, 403].includes(cause.response?.status ?? 0)
            ? "Please sign in with your founder account."
            : "Unable to load feedback. Please try again."
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [reload])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold">Feedback results</h2>
        <button
          type="button"
          disabled={loading}
          onClick={() => setReload((value) => value + 1)}
          className="min-h-10 rounded-full border bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
      {loading ? (
        <p role="status" className="text-sm text-stone-500">
          Loading feedback...
        </p>
      ) : error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : feedbacks.length === 0 ? (
        <p className="text-sm text-stone-500">No feedback results yet.</p>
      ) : (
        <ul className="space-y-3">
          {feedbacks.map((feedback) => (
            <li
              key={feedback.id}
              className="rounded-lg border bg-white p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-orange-50 px-3 py-1 font-bold text-primary">
                  Score: {feedback.score}
                </span>
                <time dateTime={feedback.createdAt}>
                  {new Date(feedback.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </div>
              <h3 className="mt-4 text-lg font-bold tracking-tight">
                {feedback.title}
              </h3>
              <span
                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  feedback.priority === "red"
                    ? "bg-green-100 text-green-800"
                    : feedback.priority === "yellow"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                Priority:{" "}
                {feedback.priority === "red"
                  ? "High"
                  : feedback.priority === "yellow"
                    ? "Medium"
                    : "Low"}
              </span>
              <p className="mt-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-muted-foreground">
                {feedback.summary}
              </p>
              {feedback.contradiction && (
                <p className="mt-3 text-sm text-stone-600">
                  Contradiction: {feedback.contradiction}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
