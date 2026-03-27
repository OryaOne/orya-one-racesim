const API_PROXY_URL = "/api/racesim";

function normalizeApiErrorMessage(text: string, status: number): string {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (!trimmed) {
    return "API request failed";
  }

  if (lower.includes("function_invocation_timeout")) {
    return "The RaceSim proxy timed out before the backend completed. The live request was cut down and retried, but this scenario still exceeded the production budget. Try again or lower runs/detail.";
  }

  if (lower.startsWith("<!doctype html") || lower.startsWith("<html")) {
    if (status === 502) {
      return "The RaceSim backend is temporarily unavailable. Render returned a bad gateway response.";
    }

    if (status === 503 || status === 504) {
      return "The RaceSim backend is temporarily unavailable. Wait a moment and try again.";
    }

    return "The RaceSim backend returned an unexpected HTML error response.";
  }

  return trimmed;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    let message = normalizeApiErrorMessage(text, response.status);
    try {
      const payload = JSON.parse(text) as { detail?: string };
      message = payload.detail || message;
    } catch {
      // Keep the raw text if it is not valid JSON.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function fetchDefaults<T>() {
  const response = await fetch(`${API_PROXY_URL}/defaults`, {
    cache: "no-store",
  });
  return handleResponse<T>(response);
}

export async function fetchSuggestions<T>(payload: object) {
  const response = await fetch(`${API_PROXY_URL}/strategy-suggestions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<T>(response);
}

export async function runSimulation<T>(payload: object) {
  const response = await fetch(`${API_PROXY_URL}/simulate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<T>(response);
}
