import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { buildWorkbook } from '@/lib/exportWorkbook'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: { client: true, schedules: true },
  })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const wb = await buildWorkbook(job, job.client, job.schedules)
  const buffer = await wb.xlsx.writeBuffer()

  const yearEnd = new Date(job.yearEndDate).toISOString().slice(0, 10)
  const safeName = job.client.name.replace(/[\\/:*?"<>|]/g, '').trim()
  const filename = `${safeName} - Working Papers - YE ${yearEnd}.xlsx`

  await prisma.job.update({ where: { id: job.id }, data: { exportedAt: new Date() } })

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'X-Suggested-Folder': job.client.folderPath ? encodeURIComponent(job.client.folderPath) : '',
    },
  })
}
