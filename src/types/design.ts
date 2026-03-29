export interface ColumnMeta {
  key: string
  label: string
  type: 'number' | 'string'
  role: 'input' | 'output'
  min?: number
  max?: number
}

export interface DesignIteration {
  id: string
  [key: string]: string | number
}
