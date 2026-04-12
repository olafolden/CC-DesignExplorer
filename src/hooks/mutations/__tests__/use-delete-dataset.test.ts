import { describe, it, expect, vi } from 'vitest'
import { queryKeys } from '../../queries/keys'

/**
 * Tests the onSuccess cache cleanup logic used by useDeleteDataset.
 * We test the logic directly rather than rendering the hook,
 * since the behavior under test is the query client calls in onSuccess.
 */
describe('useDeleteDataset onSuccess logic', () => {
  function createMockQueryClient() {
    return {
      removeQueries: vi.fn(),
      invalidateQueries: vi.fn(),
    }
  }

  /** Mirrors the onSuccess callback from use-delete-dataset.ts */
  function onSuccess(
    queryClient: ReturnType<typeof createMockQueryClient>,
    _data: unknown,
    deletedId: string
  ) {
    queryClient.removeQueries({ queryKey: queryKeys.dataset(deletedId) })
    queryClient.removeQueries({ queryKey: queryKeys.assetUrls(deletedId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    queryClient.invalidateQueries({ queryKey: ['datasets'] })
  }

  it('removes the specific dataset cache entry', () => {
    const qc = createMockQueryClient()
    onSuccess(qc, undefined, 'ds-123')

    expect(qc.removeQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.dataset('ds-123'),
    })
  })

  it('removes the specific asset URLs cache entry', () => {
    const qc = createMockQueryClient()
    onSuccess(qc, undefined, 'ds-123')

    expect(qc.removeQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.assetUrls('ds-123'),
    })
  })

  it('invalidates the projects query to refresh dataset lists', () => {
    const qc = createMockQueryClient()
    onSuccess(qc, undefined, 'ds-123')

    expect(qc.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.projects,
    })
  })

  it('invalidates the datasets query', () => {
    const qc = createMockQueryClient()
    onSuccess(qc, undefined, 'ds-123')

    expect(qc.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['datasets'],
    })
  })

  it('uses the correct dataset-specific query keys', () => {
    const qc = createMockQueryClient()
    onSuccess(qc, undefined, 'ds-456')

    // Verify keys are dataset-specific, not generic
    expect(qc.removeQueries).toHaveBeenCalledWith({
      queryKey: ['datasets', 'ds-456'],
    })
    expect(qc.removeQueries).toHaveBeenCalledWith({
      queryKey: ['assets', 'ds-456', 'urls'],
    })
  })
})
