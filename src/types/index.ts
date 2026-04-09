import type {
  User,
  Client,
  Prospect,
  ClientOnboarding,
  HMRCAuthorisation,
  TaxReturn,
  Task,
} from '@prisma/client'

export type { User, Client, Prospect, ClientOnboarding, HMRCAuthorisation, TaxReturn, Task }

export type ClientWithOnboarding = Client & {
  onboarding: ClientOnboarding | null
}

export type ClientFull = Client & {
  onboarding: ClientOnboarding | null
  hmrcAuths: HMRCAuthorisation[]
  taxReturns: TaxReturn[]
  tasks: Task[]
}

export type TaxReturnWithClient = TaxReturn & {
  client: Pick<Client, 'id' | 'ref' | 'name' | 'companyName'>
  assignedTo: Pick<User, 'id' | 'name'> | null
}

export type HMRCAuthWithClient = HMRCAuthorisation & {
  client: Pick<Client, 'id' | 'ref' | 'name' | 'companyName'>
}

export type ProspectWithUser = Prospect & {
  assignedTo: Pick<User, 'id' | 'name'> | null
}

export type OnboardingWithClient = ClientOnboarding & {
  client: Pick<Client, 'id' | 'ref' | 'name' | 'companyName' | 'clientType'>
}

export type TaskWithRelations = Task & {
  client: Pick<Client, 'id' | 'ref' | 'name'> | null
  assignedTo: Pick<User, 'id' | 'name'> | null
  createdBy: Pick<User, 'id' | 'name'> | null
}

export type DashboardStats = {
  activeClients: number
  prospects: number
  pendingHMRCAuths: number
  taxReturnsDueSoon: number
  overdueReturns: number
  openTasks: number
  urgentTasks: number
  inProgressOnboarding: number
}

// Session user extension
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
    }
  }
}
