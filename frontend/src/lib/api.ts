import type {
  Tank, TankWithLevel, TankCreate,
  Movement, MovementCreate, MovementComplete, MovementUpdate, AdjustmentCreate,
  DashboardStats, PDFExtractionResult, PDFImportRequest, PDFImportResult, TransferCreate
} from './types';

const API_BASE = 'http://localhost:8000/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
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
  getAll: (location?: string) => {
    const params = location ? `?location=${encodeURIComponent(location)}` : '';
    return fetchAPI<TankWithLevel[]>(`/tanks${params}`);
  },
  getById: (id: string) => fetchAPI<TankWithLevel>(`/tanks/${id}`),
  getHistory: (id: string) => fetchAPI<Movement[]>(`/tanks/${id}/history`),
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
  getAll: (tankId?: string, type?: string, status?: string) => {
    const params = new URLSearchParams();
    if (tankId) params.append('tank_id', tankId);
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI<Movement[]>(`/movements${query}`);
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
