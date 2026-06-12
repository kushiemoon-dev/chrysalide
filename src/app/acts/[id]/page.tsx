import { redirect } from 'next/navigation'

export default function ActDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const p = params as unknown as { id: string }
  redirect(`/objectives/${p.id}`)
}
