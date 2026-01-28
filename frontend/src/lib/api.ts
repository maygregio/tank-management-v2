import type {
  Tank, TankWithLevel, TankCreate,
  Movement, MovementCreate, MovementComplete, MovementUpdate, AdjustmentCreate,
  PDFExtractionResult, PDFImportRequest, PDFImportResult, TransferCreate,
  SignalAssignment, SignalUploadResult, TradeInfoUpdate,
  COAWithSignal, COALinkRequest,
  AdjustmentExtractionResult, AdjustmentImportRequest, AdjustmentImportResult,
  MovementWithCOA, PaginatedResponse,
  TerminalSummary, TerminalDailyAggregation
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
  getAll: (
    params?: {
      tankId?: string;
      type?: string;
      status?: string;
      source?: string;
      skip?: number;
      limit?: number;
    },
    signal?: AbortSignal
  ): Promise<PaginatedResponse<Movement>> => {
    const searchParams = new URLSearchParams();
    if (params?.tankId) searchParams.append('tank_id', params.tankId);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.source) searchParams.append('source', params.source);
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return fetchAPI<PaginatedResponse<Movement>>(`/movements${query}`, { signal });
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
  getSignals: (
    params?: { skip?: number; limit?: number },
    signal?: AbortSignal
  ): Promise<PaginatedResponse<Movement>> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return fetchAPI<PaginatedResponse<Movement>>(`/movements/signals${query}`, { signal });
  },
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

// Overview (movements with COA join)
export const overviewApi = {
  getAll: (
    params?: { skip?: number; limit?: number },
    signal?: AbortSignal
  ): Promise<PaginatedResponse<MovementWithCOA>> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return fetchAPI<PaginatedResponse<MovementWithCOA>>(`/movements/overview${query}`, { signal });
  },
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
  getAll: (signal?: AbortSignal) => fetchAPI<COAWithSignal[]>('/coa', { signal }),

  getById: (id: string, signal?: AbortSignal) => fetchAPI<COAWithSignal>(`/coa/${id}`, { signal }),

  getBySignalId: (signalId: string, signal?: AbortSignal) => fetchAPI<COAWithSignal | null>(`/coa/signal/${signalId}`, { signal }),

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
  getPdfUrl: (blobName: string) => `${API_BASE}/coa/pdf/${encodeURIComponent(blobName)}`,
};

// Adjustment Imports
export const adjustmentsApi = {
  extractFromPDFs: async (files: File[]): Promise<AdjustmentExtractionResult[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await fetch(`${API_BASE}/adjustments/extract`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Extraction failed' }));
      throw new Error(error.detail || 'Extraction failed');
    }

    return response.json();
  },

  confirmImport: (data: AdjustmentImportRequest) =>
    fetchAPI<AdjustmentImportResult>('/adjustments/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPdfUrl: (blobName: string) => `${API_BASE}/adjustments/pdf/${encodeURIComponent(blobName)}`,
};

// Terminals
export const terminalsApi = {
  getAll: (signal?: AbortSignal) =>
    fetchAPI<TerminalSummary[]>('/terminals', { signal }),

  getLocations: (signal?: AbortSignal) =>
    fetchAPI<string[]>('/terminals/locations', { signal }),

  getAggregatedHistory: (location: string, startDate: string, endDate: string, signal?: AbortSignal) => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    return fetchAPI<TerminalDailyAggregation[]>(
      `/terminals/${encodeURIComponent(location)}/history?${params.toString()}`,
      { signal }
    );
  },
};
