"use client"

import { useMemo, useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UploadCloud, Download } from "lucide-react"

type Application = {
  id: string
  name: string
  phone: string
  mark10: number
  mark12: number
  pdf10Url?: string
  pdf12Url?: string
  stream: "engineering" | "arts" | "medical" | "law"
}

const MOCK_APPS: Application[] = [
  {
    id: "a1",
    name: "Karan Verma",
    phone: "+91 90123 45678",
    mark10: 92,
    mark12: 88,
    pdf10Url: "#",
    pdf12Url: "#",
    stream: "engineering",
  },
  {
    id: "a2",
    name: "Sara Ali",
    phone: "+91 99876 54321",
    mark10: 89,
    mark12: 91,
    pdf10Url: "#",
    pdf12Url: "#",
    stream: "medical",
  },
  { id: "a3", name: "Liam Jones", phone: "+1 415-555-0198", mark10: 85, mark12: 84, stream: "arts" },
]

type ApprovedItem = {
  id: string
  name: string
  phone: string
  stream: Application["stream"]
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

export default function ApplicationsTable() {
  const [apps, setApps] = useState<Application[]>(MOCK_APPS)
  const [q, setQ] = useState("")

  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  const rows = useMemo(() => {
    const v = q.toLowerCase().trim()
    const source = apps
    if (!v) return source
    return source.filter(
      (r) =>
        r.name.toLowerCase().includes(v) || r.phone.toLowerCase().includes(v) || r.stream.toLowerCase().includes(v),
    )
  }, [q, apps])

  const approve = (r: Application) => {
    const newApproved: ApprovedItem = {
      id: r.id,
      name: r.name,
      phone: r.phone,
      stream: r.stream,
      amount: 0,
      paymentEnabled: false,
    }
    if (hydrated) {
      const existing = getApprovedFromLS()
      const merged = [...existing.filter((x) => x.id !== r.id), newApproved]
      setApprovedToLS(merged)
    }
    setApps((prev) => prev.filter((x) => x.id !== r.id))
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-medium">Applications</h2>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone, stream"
          className="w-[260px]"
        />
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>10th Mark</TableHead>
              <TableHead>12th Mark</TableHead>
              <TableHead>10th Mark PDF</TableHead>
              <TableHead>12th Mark PDF</TableHead>
              <TableHead>Stream</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.phone}</TableCell>
                <TableCell>{r.mark10}</TableCell>
                <TableCell>{r.mark12}</TableCell>
                <TableCell>
                  {r.pdf10Url ? (
                    <div className="flex items-center gap-2">
                      <a className="text-primary underline" href={r.pdf10Url} target="_blank" rel="noreferrer">
                        View
                      </a>
                      <a
                        href={r.pdf10Url}
                        download
                        aria-label={`Download 10th Mark PDF for ${r.name}`}
                        className="inline-flex items-center text-muted-foreground hover:text-foreground"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell>
                  {r.pdf12Url ? (
                    <div className="flex items-center gap-2">
                      <a className="text-primary underline" href={r.pdf12Url} target="_blank" rel="noreferrer">
                        View
                      </a>
                      <a
                        href={r.pdf12Url}
                        download
                        aria-label={`Download 12th Mark PDF for ${r.name}`}
                        className="inline-flex items-center text-muted-foreground hover:text-foreground"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell className="capitalize">{r.stream}</TableCell>
                <TableCell className="text-right">
                  <Button variant="secondary" size="sm" className="mr-2" onClick={() => approve(r)}>
                    Approve
                  </Button>
                  <Button variant="destructive" size="sm">
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" variant="outline">
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload PDFs
        </Button>
        <Button size="sm" variant="secondary">
          Export CSV
        </Button>
      </div>
    </Card>
  )
}
