export type Session = { user: { id: string; name: string; email: string } }

export function destination(
  session: Session
): "/feedback" | "/dashboard" | null {
  if (session.user.email === "user@foxhound.test") return "/feedback"
  if (session.user.email === "founder@foxhound.test") return "/dashboard"
  return null
}

export async function authRequest<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "include",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  })
  if (!response.ok) {
    if (response.status === 401 || response.status === 400)
      throw new Error("Incorrect username or password.")
    throw new Error(
      "Unable to connect to the server. Please try again shortly."
    )
  }
  return response.json() as Promise<T>
}
