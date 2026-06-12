import { redirect } from 'next/navigation'

export default async function ActEditRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/objectives/${id}/edit`)
}
