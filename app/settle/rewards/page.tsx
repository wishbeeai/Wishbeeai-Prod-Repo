import { redirect } from "next/navigation"

export default async function SettleRewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const params = await searchParams
  const id = params?.id
  redirect(id ? `/settle/balance?id=${id}` : "/settle/balance")
}
