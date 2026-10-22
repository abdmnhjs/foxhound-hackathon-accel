import { useEffect, useState } from "react"
import axios from "axios"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@workspace/ui/components/pagination"

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
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortDirection, setSortDirection] = useState("desc")
  const priorityRank = { red: 3, yellow: 2, green: 1 }
  const sortedFeedbacks = [...feedbacks].sort((left, right) => {
    let comparison = 0
    switch (sortBy) {
      case "title":
        comparison = left.title.localeCompare(right.title, "en")
        break
      case "score":
        comparison = left.score - right.score
        break
      case "priority":
        comparison = priorityRank[left.priority] - priorityRank[right.priority]
        break
      default:
        comparison = Date.parse(left.createdAt) - Date.parse(right.createdAt)
    }
    return (
      (sortDirection === "asc" ? comparison : -comparison) ||
      left.id.localeCompare(right.id)
    )
  })
  const pageSize = 5
  const pageCount = Math.ceil(feedbacks.length / pageSize)
  const currentPage = Math.min(page, Math.max(1, pageCount))
  const visibleFeedbacks = sortedFeedbacks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const pages = Array.from(
    { length: pageCount },
    (_, index) => index + 1
  ).filter(
    (number) =>
      number === 1 ||
      number === pageCount ||
      Math.abs(number - currentPage) <= 1
  )

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
          className="min-h-10 rounded-full border bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-orange-100 hover:text-orange-900 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          Sort by
          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value)
              setPage(1)
            }}
            className="min-h-10 rounded-lg border bg-white px-3 text-sm transition-colors hover:bg-orange-100 focus-visible:outline-orange-500"
          >
            <option value="createdAt">Date</option>
            <option value="score">Score</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          Order
          <select
            value={sortDirection}
            onChange={(event) => {
              setSortDirection(event.target.value)
              setPage(1)
            }}
            className="min-h-10 rounded-lg border bg-white px-3 text-sm transition-colors hover:bg-orange-100 focus-visible:outline-orange-500"
          >
            <option value="desc">
              {sortBy === "title"
                ? "Z–A"
                : sortBy === "createdAt"
                  ? "Newest first"
                  : "Highest first"}
            </option>
            <option value="asc">
              {sortBy === "title"
                ? "A–Z"
                : sortBy === "createdAt"
                  ? "Oldest first"
                  : "Lowest first"}
            </option>
          </select>
        </label>
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
        <>
          <ul className="space-y-3">
            {visibleFeedbacks.map((feedback) => (
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
          <p
            role="status"
            className="text-center text-sm text-muted-foreground"
          >
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, feedbacks.length)} of{" "}
            {feedbacks.length} results
          </p>
          {pageCount > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={currentPage === 1}
                    tabIndex={currentPage === 1 ? -1 : undefined}
                    onClick={(event) => {
                      event.preventDefault()
                      if (currentPage > 1) setPage(currentPage - 1)
                    }}
                  />
                </PaginationItem>
                {pages.map((number, index) => (
                  <PaginationItem
                    key={number}
                    className="flex items-center gap-1"
                  >
                    {index > 0 && number - pages[index - 1] > 1 && (
                      <PaginationEllipsis />
                    )}
                    <PaginationLink
                      href="#"
                      aria-label={`Go to page ${number}`}
                      isActive={currentPage === number}
                      onClick={(event) => {
                        event.preventDefault()
                        setPage(number)
                      }}
                    >
                      {number}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={currentPage === pageCount}
                    tabIndex={currentPage === pageCount ? -1 : undefined}
                    onClick={(event) => {
                      event.preventDefault()
                      if (currentPage < pageCount) setPage(currentPage + 1)
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  )
}
