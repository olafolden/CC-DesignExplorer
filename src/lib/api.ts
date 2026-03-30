// Client-side API helpers for fetching from Next.js API routes

export interface Project {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface DatasetResponse {
  id: string
  name: string
  projectId: string
  columns: import('@/types/design').ColumnMeta[]
  rowCount: number
  data: import('@/types/design').DesignIteration[]
}

export interface DatasetCreateResponse {
  id: string
  columns: import('@/types/design').ColumnMeta[]
  rowCount: number
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || `API error: ${res.status}`)
  }
  return res.json()
}

export async function fetchProjects(): Promise<Project[]> {
  return apiFetch('/api/projects')
}

export async function createProject(name: string): Promise<Project> {
  return apiFetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function deleteProject(id: string): Promise<void> {
  await apiFetch(`/api/projects/${id}`, { method: 'DELETE' })
}

export async function uploadDataset(
  projectId: string,
  jsonString: string,
  fileName: string
): Promise<DatasetCreateResponse> {
  return apiFetch('/api/datasets', {
    method: 'POST',
    body: JSON.stringify({ projectId, jsonString, fileName }),
  })
}

export async function fetchDataset(id: string): Promise<DatasetResponse> {
  return apiFetch(`/api/datasets/${id}`)
}

export async function deleteDataset(id: string): Promise<void> {
  await apiFetch(`/api/datasets/${id}`, { method: 'DELETE' })
}
