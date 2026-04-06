export const queryKeys = {
  projects: ['projects'] as const,
  projectDatasets: (projectId: string) =>
    ['projects', projectId, 'datasets'] as const,
  dataset: (datasetId: string) => ['datasets', datasetId] as const,
  assetUrls: (datasetId: string) => ['assets', datasetId, 'urls'] as const,
  preferences: ['preferences'] as const,
}
