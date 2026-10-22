const apiOrigin = process.env.API_ORIGIN

if (!apiOrigin) {
  throw new Error(
    "Set API_ORIGIN to the API project's stable HTTPS origin in Vercel."
  )
}

const apiUrl = new URL(apiOrigin)
if (
  apiUrl.protocol !== "https:" ||
  apiUrl.pathname !== "/" ||
  apiUrl.search ||
  apiUrl.hash ||
  apiUrl.username ||
  apiUrl.password
) {
  throw new Error(
    "API_ORIGIN must be an HTTPS origin without a path, query, or credentials."
  )
}

export default {
  framework: "tanstack-start",
  installCommand: "cd ../.. && npm install --include=dev",
  buildCommand: "npm run build",
  rewrites: [
    { source: "/api/:path*", destination: `${apiUrl.origin}/api/:path*` },
  ],
}
