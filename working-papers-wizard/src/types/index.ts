export interface Client {
  id: string
  name: string
  companyNumber: string | null
  accountingStandard: string
  folderPath: string | null
  notes: string | null
  archived: boolean
  createdAt: string
  updatedAt: string
  jobs?: Job[]
  _count?: { jobs: number }
}

export interface Job {
  id: string
  clientId: string
  yearEndDate: string
  preparedBy: string | null
  preparedDate: string | null
  reviewedBy: string | null
  reviewedDate: string | null
  requiredSchedules: string
  status: 'IN_PROGRESS' | 'COMPLETED'
  exportedAt: string | null
  exportPath: string | null
  createdAt: string
  updatedAt: string
  client?: Client
  schedules?: ScheduleRecord[]
}

export interface ScheduleRecord {
  id: string
  jobId: string
  key: string
  data: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE'
  preparedBy: string | null
  preparedDate: string | null
  reviewedBy: string | null
  reviewedDate: string | null
  createdAt: string
  updatedAt: string
}
