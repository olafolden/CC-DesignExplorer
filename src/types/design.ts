export interface ColumnMeta {
  key: string
  label: string
  type: 'number' | 'string'
  min?: number
  max?: number
}

export interface DesignIteration {
  id: string
  [key: string]: string | number
}
