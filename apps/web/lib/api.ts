const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  (process.env.NODE_ENV === "development" ? "http://localhost:8000/api" : "");

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "API request failed");
  }
  return response.json() as Promise<T>;
}

function requireApiUrl() {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured. Set it in Vercel for production deployments.",
    );
  }
  return API_URL;
}

export async function fetchDefaults<T>() {
  const response = await fetch(`${requireApiUrl()}/defaults`, {
    cache: "no-store",
  });
  return handleResponse<T>(response);
}

export async function fetchSuggestions<T>(payload: object) {
  const response = await fetch(`${requireApiUrl()}/strategy-suggestions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<T>(response);
}

export async function runSimulation<T>(payload: object) {
  const response = await fetch(`${requireApiUrl()}/simulate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<T>(response);
}
