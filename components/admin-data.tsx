export type Tenant = { id: string; name: string; email: string; plan: string; status: 'Active' | 'Trial' | 'Past due'; usage: number; spend: string; chats: string; widget: boolean; updated: string }

export const tenants: Tenant[] = [
  { id: 'tn_8Y2A', name: 'Northstar Health', email: 'ops@northstar.health', plan: 'Growth', status: 'Active', usage: 68, spend: '$1,240', chats: '18.2k', widget: true, updated: '2 min ago' },
  { id: 'tn_4K1D', name: 'Acme Technologies', email: 'team@acme.io', plan: 'Pro', status: 'Active', usage: 42, spend: '$860', chats: '9.8k', widget: true, updated: '18 min ago' },
  { id: 'tn_7B9P', name: 'Cedar & Co.', email: 'hello@cedar.co', plan: 'Starter', status: 'Trial', usage: 15, spend: '$0', chats: '1.2k', widget: false, updated: '1 hr ago' },
  { id: 'tn_2R6M', name: 'Atlas Finance', email: 'data@atlasfinance.com', plan: 'Enterprise', status: 'Past due', usage: 87, spend: '$4,200', chats: '42.6k', widget: true, updated: '3 hr ago' },
  { id: 'tn_9L3Q', name: 'Lumina Studio', email: 'admin@lumina.studio', plan: 'Pro', status: 'Active', usage: 31, spend: '$860', chats: '7.1k', widget: true, updated: 'Yesterday' },
]

export function Status({ status }: { status: Tenant['status'] }) {
  const styles = status === 'Active' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : status === 'Trial' ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
  return <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${styles}`}>{status}</span>
}
