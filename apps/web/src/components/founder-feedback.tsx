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
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-medium">Feedback results</h3>
        <button
          type="button"
          disabled={loading}
          onClick={() => setReload((value) => value + 1)}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-stone-50 disabled:opacity-50"
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
        <ul className="space-y-4">
          {feedbacks.map((feedback) => (
            <li key={feedback.id} className="rounded-xl border p-5">
              <div className="flex flex-wrap justify-between gap-2 text-sm text-stone-500">
                <span>Score: {feedback.score}</span>
                <time dateTime={feedback.createdAt}>
                  {new Date(feedback.createdAt).toLocaleString("en-GB")}
                </time>
              </div>
              <h4 className="mt-3 font-semibold">{feedback.title}</h4>
              <span
                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  feedback.priority === "red"
                    ? "bg-red-100 text-red-800"
                    : feedback.priority === "yellow"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                }`}
              >
                Priority:{" "}
                {feedback.priority === "red"
                  ? "High"
                  : feedback.priority === "yellow"
                    ? "Medium"
                    : "Low"}
              </span>
              <p className="mt-3 break-words whitespace-pre-wrap">
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
