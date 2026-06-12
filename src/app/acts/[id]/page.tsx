import { redirect } from 'next/navigation'

export default async function ActDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/objectives/${id}`)
}
