"use client"

import { useEffect, useMemo, useState } from "react"
import Layout from "@/components/kokonutui/layout"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type ApprovedItem = {
  id: string
  name: string
  phone: string
  stream: "engineering" | "arts" | "medical" | "law"
  amount?: number
  paymentEnabled?: boolean
}

const LS_KEY = "approved_items"

function getApprovedFromLS(): ApprovedItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as ApprovedItem[]) : []
  } catch {
    return []
  }
}

function setApprovedToLS(items: ApprovedItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export default function ApprovedPage() {
  const [items, setItems] = useState<ApprovedItem[]>([])

  useEffect(() => {
    setItems(getApprovedFromLS())
  }, [])

  useEffect(() => {
    setApprovedToLS(items)
  }, [items])

  const byStream = useMemo(() => {
    return items.reduce<Record<ApprovedItem["stream"], ApprovedItem[]>>(
      (acc, it) => {
        acc[it.stream].push(it)
        return acc
      },
      { engineering: [], arts: [], medical: [], law: [] },
    )
  }, [items])

  const updateItem = (id: string, updates: Partial<ApprovedItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)))
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  return (
    <Layout>
      <main className="p-4 space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-pretty">Approved</h1>
          <p className="text-sm text-muted-foreground">Enable payments and set the amount per approved applicant.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.stream} • {item.phone}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Enable Payment</span>
                  <Switch
                    checked={!!item.paymentEnabled}
                    onCheckedChange={(v) => updateItem(item.id, { paymentEnabled: v })}
                    aria-label={`Enable payment for ${item.name}`}
                  />
                </div>
              </div>

              <div className="mt-3 grid gap-2">
                <label className="text-xs text-muted-foreground" htmlFor={`amount-${item.id}`}>
                  Amount to Pay
                </label>
                <Input
                  id={`amount-${item.id}`}
                  type="number"
                  min={0}
                  value={item.amount ?? 0}
                  onChange={(e) => updateItem(item.id, { amount: Number(e.target.value || 0) })}
                  aria-label={`Amount to pay for ${item.name}`}
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => removeItem(item.id)}>
                  Remove
                </Button>
                <Button size="sm" disabled={!item.paymentEnabled || (item.amount ?? 0) <= 0}>
                  Save
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {items.length === 0 && (
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">
              No approved applications yet. Go to Admin → Applications and click Approve to add here.
            </p>
          </Card>
        )}
      </main>
    </Layout>
  )
}
