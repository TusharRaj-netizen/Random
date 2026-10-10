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

// ===========================================================================
// Feature 1: Facilities
// ===========================================================================
export type FacilityType = "hospital" | "pharmacy" | "jan_aushadhi" | "chemist_24x7";

export interface NearbyFacility {
  id: string;
  name: string;
  type: FacilityType;
  lat: number;
  lng: number;
  address: string;
  phone: string | null;
  open_hours: string | null;
  is_24x7: boolean;
  distance_km: number;
  distance_label: string;
  maps_url: string;
}

export interface NearbyFacilitiesResponse {
  lat: number;
  lng: number;
  filter: string;
  count: number;
  facilities: NearbyFacility[];
}

export async function getNearbyFacilities(
  lat?: number,
  lng?: number,
  filter: string = "all",
): Promise<NearbyFacilitiesResponse> {
  const params = new URLSearchParams({ filter });
  if (lat != null) params.set("lat", String(lat));
  if (lng != null) params.set("lng", String(lng));
  return request<NearbyFacilitiesResponse>(`/api/facilities/nearby?${params.toString()}`);
}

// ===========================================================================
// Feature 3: Market price comparison & fluctuations
// ===========================================================================
export interface MarketMedicine {
  id: string;
  brand_name: string;
  salt_composition: string;
  manufacturer: string;
  dosage_form: string;
}

export interface CurrentPrice {
  source: string;
  selling_price: number;
  mrp: number;
  is_jan_aushadhi: boolean;
  savings_vs_highest: number | null;
}

export interface PricePoint {
  medicine_id: string;
  recorded_date: string;
  source: string;
  mrp: number;
  selling_price: number;
}

export interface FluctuationResponse {
  medicine: MarketMedicine;
  nppa_ceiling_price: number;
  current_prices: CurrentPrice[];
  history: PricePoint[];
  jan_aushadhi_monthly_savings: number;
}

export interface MarketMedicineListResponse {
  count: number;
  medicines: MarketMedicine[];
}

export async function listMarketMedicines(): Promise<MarketMedicineListResponse> {
  return request<MarketMedicineListResponse>("/api/market/medicines");
}

export async function getFluctuations(medicineId: string): Promise<FluctuationResponse> {
  return request<FluctuationResponse>(`/api/market/medicines/${medicineId}/fluctuations`);
}

// ===========================================================================
// Feature 4: Government schemes
// ===========================================================================
export interface GovScheme {
  id: string;
  name_en: string;
  name_hi: string;
  category: string;
  benefit_summary_en: string;
  benefit_summary_hi: string;
  eligibility_en: string;
  eligibility_hi: string;
  official_link: string;
  icon: string;
}

export interface SchemesResponse {
  count: number;
  schemes: GovScheme[];
}

export async function getSchemes(): Promise<SchemesResponse> {
  return request<SchemesResponse>("/api/schemes");
}

// ===========================================================================
// Feature 5: Cline assistant audit workflows
// ===========================================================================
export interface AuditWorkflow {
  key: string;
  label: string;
  description: string;
}

export interface AuditResult {
  workflow: string;
  status: string;
  summary: string;
  details: string[];
  timestamp: string;
}

export async function listAuditWorkflows(): Promise<{ workflows: AuditWorkflow[] }> {
  return request<{ workflows: AuditWorkflow[] }>("/api/cline/workflows");
}

export async function runAuditWorkflow(workflow: string): Promise<AuditResult> {
  return request<AuditResult>(`/api/cline/run/${workflow}`, { method: "POST" });
}

// ===========================================================================
// Feature 1: Dynamic medicine search (autocomplete)
// ===========================================================================
export interface MarketMedicine {
  id: string;
  brand_name: string;
  salt_composition: string;
  manufacturer: string;
  dosage_form: string;
  pack_size: number;
  unit_mrp: number;
}

export interface MarketSearchResponse {
  query: string;
  count: number;
  medicines: MarketMedicine[];
}

export async function searchMarketMeds(query: string, limit: number = 20): Promise<MarketSearchResponse> {
  return request<MarketSearchResponse>(`/api/market/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

// ===========================================================================
// Feature 3: Basket / recurring order planner
// ===========================================================================
export interface BasketItemReq {
  medicine_id: string;
  daily_dosage: number;
}

export interface BasketResult {
  medicine_id: string;
  brand_name: string;
  daily_dosage: number;
  duration_days: number;
  total_units: number;
  strips_needed: number;
  prices_per_source: Record<string, number>;
  highest_price: number;
  jan_aushadhi_total: number;
  savings: number;
}

export interface BasketCalculationResponse {
  items: BasketResult[];
  duration_days: number;
  source_totals: Record<string, number>;
  total_savings: number;
}

export async function calculateBasket(items: BasketItemReq[], durationDays: number): Promise<BasketCalculationResponse> {
  return request<BasketCalculationResponse>(`/api/market/basket?duration_days=${durationDays}`, {
    method: "POST",
    body: JSON.stringify(items),
  });
}

// ===========================================================================
// Feature 4: Transit fare estimation
// ===========================================================================
export interface FareEstimate {
  type: string;
  label: string;
  base_fare: number;
  per_km_rate: number;
  estimated_fare: number;
}

export interface FareEstimateResponse {
  distance_km: number;
  fares: FareEstimate[];
}

export async function getFareEstimates(distanceKm: number): Promise<FareEstimateResponse> {
  return request<FareEstimateResponse>(`/api/market/fares?distance_km=${distanceKm}`);
}

// ===========================================================================
// Feature 6: Medicine insights (tips & patient experiences)
// ===========================================================================
export interface LifestyleTip {
  type: string;
  text: string;
}

export interface PatientExperience {
  patient: string;
  feedback: string;
  effectiveness: string;
}

export interface MedicineInsight {
  medicine_id: string;
  condition: string;
  condition_hi: string;
  lifestyle_tips: LifestyleTip[];
  timing_advice: string;
  food_interactions: string;
  patient_experiences: PatientExperience[];
}

export async function getMedicineInsight(medicineId: string): Promise<MedicineInsight> {
  return request<MedicineInsight>(`/api/market/medicines/${medicineId}/insights`);
}