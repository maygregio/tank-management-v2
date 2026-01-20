import type {
  Tank, TankWithLevel, TankCreate,
  Movement, MovementCreate, MovementComplete, MovementUpdate, AdjustmentCreate,
  DashboardStats, PDFExtractionResult, PDFImportRequest, PDFImportResult, TransferCreate,
  SignalAssignment, SignalUploadResult, TradeInfoUpdate,
  COAWithSignal, COALinkRequest
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface FetchAPIOptions extends Omit<RequestInit, 'signal'> {
  signal?: AbortSignal;
}

async function fetchAPI<T>(endpoint: string, options?: FetchAPIOptions): Promise<T> {
  const { signal, headers, ...restOptions } = options || {};

  const response = await fetch(`${API_BASE}${endpoint}`, {
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...restOptions,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Tanks
export const tanksApi = {
  getAll: (location?: string, signal?: AbortSignal) => {
    const params = location ? `?location=${encodeURIComponent(location)}` : '';
    return fetchAPI<TankWithLevel[]>(`/tanks${params}`, { signal });
  },
  getById: (id: string, signal?: AbortSignal) => fetchAPI<TankWithLevel>(`/tanks/${id}`, { signal }),
  getHistory: (id: string, signal?: AbortSignal) => fetchAPI<Movement[]>(`/tanks/${id}/history`, { signal }),
  create: (data: TankCreate) => fetchAPI<Tank>('/tanks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<TankCreate>) => fetchAPI<Tank>(`/tanks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<void>(`/tanks/${id}`, { method: 'DELETE' }),
};

// Movements
export const movementsApi = {
  getAll: (tankId?: string, type?: string, status?: string, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (tankId) params.append('tank_id', tankId);
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI<Movement[]>(`/movements${query}`, { signal });
  },
  create: (data: MovementCreate) => fetchAPI<Movement>('/movements', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  createTransfer: (data: TransferCreate) => fetchAPI<Movement[]>('/movements/transfer', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: MovementUpdate) => fetchAPI<Movement>(`/movements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  complete: (id: string, data: MovementComplete) => fetchAPI<Movement>(`/movements/${id}/complete`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  createAdjustment: (data: AdjustmentCreate) => fetchAPI<Movement>('/movements/adjustment', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<void>(`/movements/${id}`, { method: 'DELETE' }),
  // Signal methods
  getSignals: (signal?: AbortSignal) => fetchAPI<Movement[]>('/movements/signals', { signal }),
  uploadSignals: async (file: File): Promise<SignalUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/movements/signals/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  },
  assignSignal: (id: string, data: SignalAssignment) => fetchAPI<Movement>(`/movements/${id}/assign`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  updateTradeInfo: (id: string, data: TradeInfoUpdate) => fetchAPI<Movement>(`/movements/${id}/trade`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Dashboard
export const dashboardApi = {
  getStats: () => fetchAPI<DashboardStats>('/tanks/dashboard'),
};

// Imports
export const importsApi = {
  extractFromPDFs: async (files: File[]): Promise<PDFExtractionResult[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await fetch(`${API_BASE}/imports/extract`, {
      method: 'POST',
      body: formData,
      // Note: Don't set Content-Type header for FormData - browser sets it with boundary
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Extraction failed' }));
      throw new Error(error.detail || 'Extraction failed');
    }

    return response.json();
  },

  confirmImport: (data: PDFImportRequest) =>
    fetchAPI<PDFImportResult>('/imports/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Certificate of Analysis (COA)
export const coaApi = {
  getAll: () => fetchAPI<COAWithSignal[]>('/coa'),

  getById: (id: string) => fetchAPI<COAWithSignal>(`/coa/${id}`),

  getBySignalId: (signalId: string) => fetchAPI<COAWithSignal | null>(`/coa/signal/${signalId}`),

  upload: async (file: File, signalId?: string): Promise<COAWithSignal> => {
    const formData = new FormData();
    formData.append('file', file);

    const params = signalId ? `?signal_id=${encodeURIComponent(signalId)}` : '';

    const response = await fetch(`${API_BASE}/coa/upload${params}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  },

  link: (coaId: string, data: COALinkRequest) =>
    fetchAPI<COAWithSignal>(`/coa/${coaId}/link`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => fetchAPI<void>(`/coa/${id}`, { method: 'DELETE' }),
};
