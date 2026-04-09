import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const currentUserId = (session.user as { id?: string }).id
  const isAdmin = (session.user as { role?: string }).role === 'ADMIN'

  // Users can only edit their own account unless admin
  if (!isAdmin && currentUserId !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const updateData: Record<string, unknown> = {}

  if (body.name) updateData.name = body.name
  if (body.email) updateData.email = body.email.toLowerCase()
  if (body.password) updateData.password = await bcrypt.hash(body.password, 12)
  if (isAdmin && body.role) updateData.role = body.role
  if (isAdmin && body.active !== undefined) updateData.active = body.active

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, active: true },
  })

  return NextResponse.json(user)
}
