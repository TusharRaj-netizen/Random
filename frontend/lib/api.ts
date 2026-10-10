// Shared TypeScript types matching the backend schemas and a thin API client.
// All requests go through the Next.js rewrite at /api/* which proxies to the
// FastAPI backend, keeping the backend URL out of the browser bundle.

export type Language = "en" | "hi" | "hinglish";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface ChatSource {
  title: string;
  type: string;
}

export interface ChatResponse {
  reply: string;
  language: string;
  sources: ChatSource[];
  disclaimer: string;
  timestamp: string;
}

export interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  category: string;
  indication: string;
  jan_aushadhi_price_inr: number;
  branded_price_inr: number;
  dosage_form: string;
  strength: string;
  hindi_name: string;
  precautions: string;
}

export interface MedicineSearchResponse {
  query: string;
  count: number;
  medicines: Medicine[];
}

export interface MedicineDetail extends Medicine {
  savings_percent: number;
  savings_description: string;
}

export interface Reminder {
  id: string;
  medicine_name: string;
  dosage: string;
  time_slots: string[];
  frequency: string;
  notes: string;
  with_food: boolean;
  created_at: string;
  active: boolean;
}

export interface HealthTip {
  id: string;
  title: string;
  title_hindi: string;
  category: string;
  body: string;
  body_hindi: string;
  icon: string;
}

export interface HealthTipsResponse {
  count: number;
  tips: HealthTip[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Chat -----------------------------------------------------------------
export async function sendChat(
  message: string,
  history: ChatMessage[],
  language: Language,
  userProfile?: { name?: string; age?: number; conditions?: string[]; allergies?: string[] },
): Promise<ChatResponse> {
  return request<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, history, language, user_profile: userProfile ?? null }),
  });
}

// --- Medicines -------------------------------------------------------------
export async function searchMedicines(query: string, category?: string): Promise<MedicineSearchResponse> {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (category) params.set("category", category);
  return request<MedicineSearchResponse>(`/api/medicines?${params.toString()}`);
}

export async function getMedicine(id: string): Promise<MedicineDetail> {
  return request<MedicineDetail>(`/api/medicines/${id}`);
}

export async function getMedicineCategories(): Promise<{ categories: string[] }> {
  return request<{ categories: string[] }>(`/api/medicines/categories`);
}

// --- Reminders -------------------------------------------------------------
export async function listReminders(activeOnly = false): Promise<Reminder[]> {
  return request<Reminder[]>(`/api/reminders${activeOnly ? "?active_only=true" : ""}`);
}

export async function createReminder(
  payload: Omit<Reminder, "id" | "created_at" | "active">,
): Promise<Reminder> {
  return request<Reminder>("/api/reminders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateReminder(
  id: string,
  payload: Partial<Omit<Reminder, "id" | "created_at">>,
): Promise<Reminder> {
  return request<Reminder>(`/api/reminders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteReminder(id: string): Promise<void> {
  await request<void>(`/api/reminders/${id}`, { method: "DELETE" });
}

// --- Health tips -----------------------------------------------------------
export async function getHealthTips(category?: string): Promise<HealthTipsResponse> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  return request<HealthTipsResponse>(`/api/health/tips${params.toString() ? `?${params.toString()}` : ""}`);
}

export async function getHealthTipCategories(): Promise<{ categories: string[] }> {
  return request<{ categories: string[] }>(`/api/health/tips/categories`);
}

// --- Health check ----------------------------------------------------------
export async function getHealthCheck(): Promise<{
  status: string;
  version: string;
  gemini_available: boolean;
}> {
  return request("/api/health");
}