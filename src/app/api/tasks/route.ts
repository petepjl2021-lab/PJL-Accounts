import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''
  const priority = searchParams.get('priority') ?? ''

  const tasks = await prisma.task.findMany({
    where: {
      status: status || undefined,
      priority: priority || undefined,
      OR: search
        ? [
            { title: { contains: search } },
            { client: { name: { contains: search } } },
          ]
        : undefined,
    },
    include: {
      client: { select: { id: true, ref: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' },
      { createdAt: 'desc' },
    ],
  })

  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const userId = (session.user as { id?: string }).id

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description || null,
      clientId: body.clientId || null,
      status: body.status || 'TODO',
      priority: body.priority || 'MEDIUM',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      assignedToId: body.assignedToId || null,
      createdById: userId || null,
    },
    include: {
      client: { select: { id: true, ref: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(task, { status: 201 })
}
