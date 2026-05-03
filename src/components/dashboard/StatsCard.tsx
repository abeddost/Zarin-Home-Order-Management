import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
  subtitle?: string
}

export function StatsCard({ title, value, icon: Icon, color = 'text-stone-600', subtitle }: StatsCardProps) {
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-stone-900">{value}</p>
            {subtitle && <p className="text-xs text-stone-400">{subtitle}</p>}
          </div>
          <div className={cn('p-2.5 rounded-xl bg-stone-50', color)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
