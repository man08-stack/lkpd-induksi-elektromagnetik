export type RingType = 'commutator' | 'slip-ring'

export interface SimulationConfig {
  turns: number
  magneticField: number
  area: number
  omega: number
  ringType: RingType
}

export interface DataRow {
  id: number
  omega: number
  emf: number
  flux: number
}

export interface QuizAnswers {
  q1: string
  q2: string
  q3: string
}

export interface StudentIdentity {
  name: string
  className: string
  group: string
}

export interface WorksheetResponses {
  identity: StudentIdentity
  observations: string
  dataRows: DataRow[]
  quiz: QuizAnswers
  conclusion: string
}

export interface PersistedState {
  config: SimulationConfig
  running: boolean
  responses: WorksheetResponses
  savedAt: number
}
