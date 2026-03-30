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

// Asset APIs

export interface AssetMap {
  [designKey: string]: { imageUrl: string | null; modelUrl: string | null }
}

export async function uploadAsset(
  file: File,
  datasetId: string,
  designKey: string,
  assetType: 'image' | 'model'
): Promise<{ ok: boolean; storagePath: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('datasetId', datasetId)
  formData.append('designKey', designKey)
  formData.append('assetType', assetType)

  const res = await fetch('/api/assets/upload', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || `Upload failed: ${res.status}`)
  }
  return res.json()
}

export async function fetchAssetUrls(datasetId: string): Promise<AssetMap> {
  return apiFetch(`/api/assets/batch-urls?datasetId=${encodeURIComponent(datasetId)}`)
}

// Preferences APIs

export interface UserPreferences {
  theme: 'light' | 'dark'
  default_project_id: string | null
}

export async function fetchPreferences(): Promise<UserPreferences> {
  return apiFetch('/api/preferences')
}

export async function updatePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  await apiFetch('/api/preferences', {
    method: 'PUT',
    body: JSON.stringify(prefs),
  })
}

// Dataset listing for a project

export interface DatasetSummary {
  id: string
  name: string
  row_count: number
  created_at: string
}

export async function fetchProjectDatasets(projectId: string): Promise<DatasetSummary[]> {
  return apiFetch(`/api/projects/${projectId}/datasets`)
}
