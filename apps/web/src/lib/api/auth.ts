export interface AuthUser {
  id: string;
  email: string;
  username: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface SignupPayload {
  email: string;
  username: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const fieldErrors = data.errors?.fieldErrors as Record<string, string[] | undefined> | undefined;
    const firstFieldError = fieldErrors
      ? Object.values(fieldErrors).find((messages) => messages && messages.length > 0)?.[0]
      : undefined;

    throw new Error(firstFieldError ?? data.message ?? "Request failed");
  }

  return data as T;
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseResponse<AuthResponse>(response);
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseResponse<AuthResponse>(response);
}

export async function getMe(token: string): Promise<{ user: AuthUser }> {
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  return parseResponse<{ user: AuthUser }>(response);
}
