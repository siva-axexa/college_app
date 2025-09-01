"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

type Slice = { name: string; value: number }

const COLORS = ["hsl(var(--primary))", "hsl(var(--muted))", "hsl(var(--muted-foreground))"] as const

const WEEKLY: Slice[] = [
  { name: "Web", value: 420 },
  { name: "Android", value: 310 },
  { name: "iOS", value: 270 },
]

const MONTHLY: Slice[] = [
  { name: "Web", value: 1800 },
  { name: "Android", value: 1320 },
  { name: "iOS", value: 1140 },
]

export default function VisitsPie() {
  const [range, setRange] = useState<"weekly" | "monthly">("weekly")
  const data = range === "weekly" ? WEEKLY : MONTHLY
  const total = useMemo(() => data.reduce((sum, s) => sum + s.value, 0), [data])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white text-left">User Visits</h2>
          <p className="text-sm text-muted-foreground">Clean pie chart by platform</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={range === "weekly" ? "default" : "secondary"}
            onClick={() => setRange("weekly")}
            aria-pressed={range === "weekly"}
          >
            Weekly
          </Button>
          <Button
            size="sm"
            variant={range === "monthly" ? "default" : "secondary"}
            onClick={() => setRange("monthly")}
            aria-pressed={range === "monthly"}
          >
            Monthly
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        <div className="md:col-span-3 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="md:col-span-2">
          <div className="text-4xl font-semibold text-gray-900 dark:text-white">{total.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground mt-1">
            Total visits ({range === "weekly" ? "last 7 days" : "last 30 days"})
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {data.map((s, i) => (
              <li key={s.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    aria-hidden
                  />
                  {s.name}
                </span>
                <span className="tabular-nums">{s.value.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
