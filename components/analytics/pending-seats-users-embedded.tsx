"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type SeatStage = "Pending" | "Allowed Seat" | "Confirmed" | "Payment"

type UserRow = {
  id: string
  name: string
  email?: string
  phone?: string
  course?: string
  stage: SeatStage
}

const STAGES: SeatStage[] = ["Pending", "Allowed Seat", "Confirmed", "Payment"]

function stageToProgress(stage: SeatStage): number {
  const idx = STAGES.indexOf(stage)
  if (idx < 0) return 0
  const steps = STAGES.length - 1
  return Math.round((idx / steps) * 100)
}

const STORAGE_KEY = "pending-seats-by-user"

function loadFromStorage(): Record<string, SeatStage> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, SeatStage>) : {}
  } catch {
    return {}
  }
}

function saveToStorage(map: Record<string, SeatStage>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

// Mock users; replace with real data when available
const MOCK_USERS: Omit<UserRow, "stage">[] = [
  { id: "u_001", name: "Aarav Sharma", email: "aarav@example.com", phone: "+91 98765 43210", course: "Engineering" },
  { id: "u_002", name: "Diya Patel", email: "diya@example.com", phone: "+91 91234 56789", course: "Medical" },
  { id: "u_003", name: "Rohit Singh", email: "rohit@example.com", phone: "+91 99888 77665", course: "Arts" },
  { id: "u_004", name: "Neha Gupta", email: "neha@example.com", phone: "+91 90909 80807", course: "Law" },
]

export default function PendingSeatsUsersEmbedded() {
  const [map, setMap] = React.useState<Record<string, SeatStage>>({})
  const [rows, setRows] = React.useState<UserRow[]>([])

  React.useEffect(() => {
    const saved = loadFromStorage()
    setMap(saved)
  }, [])

  React.useEffect(() => {
    const hydrated: UserRow[] = MOCK_USERS.map((u) => ({
      ...u,
      stage: map[u.id] ?? "Pending",
    }))
    setRows(hydrated)
  }, [map])

  function handleStageChange(id: string, stage: SeatStage) {
    setMap((prev) => {
      const next = { ...prev, [id]: stage }
      saveToStorage(next)
      return next
    })
  }

  return (
    <div className="w-full space-y-4">
      {rows.map((row) => {
        const value = stageToProgress(row.stage)
        return (
          <div key={row.id} className={cn("rounded-md border p-3", "flex flex-col gap-3")}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{row.name}</span>
                  {row.course ? (
                    <Badge variant="secondary" className="shrink-0">
                      {row.course}
                    </Badge>
                  ) : null}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {row.email ? `${row.email} • ` : ""}
                  {row.phone || ""}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge aria-label={`Current stage: ${row.stage}`} className="shrink-0">
                  {row.stage}
                </Badge>
                <Select value={row.stage} onValueChange={(v) => handleStageChange(row.id, v as SeatStage)}>
                  <SelectTrigger className="w-[170px]" aria-label="Change stage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs">{value}%</span>
              </div>
              <Progress value={value} aria-label={`Progress ${value}%`} />
            </div>
          </div>
        )
      })}

      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No users to show.</p> : null}
    </div>
  )
}
