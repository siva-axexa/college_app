"use client"

import { useMemo, useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type PhoneLogin = {
  id: string
  phoneNumber: string
  userId: string
  createdAt: string
}

// Format numbers to Indian format: +91 98765 43210
function formatIndianPhone(raw: string) {
  const digits = raw.replace(/[^\d]/g, "")
  // If local 10-digit, assume India
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  // If starts with 91 and length 12 (e.g., 919876543210)
  if (digits.length === 12 && digits.startsWith("91")) {
    const local = digits.slice(2)
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`
  }
  // If starts with +91 already (handle variants)
  if (raw.trim().startsWith("+91")) {
    const local = digits.replace(/^91/, "").slice(-10)
    if (local.length === 10) return `+91 ${local.slice(0, 5)} ${local.slice(5)}`
  }
  // Fallback to original
  return raw
}

export default function PhoneLoginsTable() {
  const [q, setQ] = useState("")
  const [phones, setPhones] = useState<PhoneLogin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch phones data from API
  useEffect(() => {
    const fetchPhones = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/loggedin-phones')
        
        if (!response.ok) {
          throw new Error('Failed to fetch phones data')
        }
        
        const result = await response.json()
        if (result.success) {
          setPhones(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch phones data')
        }
      } catch (err: any) {
        console.error('Error fetching phones:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPhones()
  }, [])

  const rows = useMemo(() => {
    const v = q.toLowerCase().trim()
    if (!v) return phones
    return phones.filter((r) => {
      const formatted = formatIndianPhone(r.phoneNumber).toLowerCase()
      return (
        formatted.includes(v) ||
        r.phoneNumber.toLowerCase().includes(v) ||
        r.userId.toLowerCase().includes(v)
      )
    })
  }, [q, phones])

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-medium">Logged-in Phone Numbers</h2>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by phone or user"
          className="w-[260px]"
        />
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          Error: {error}
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No logged-in phones found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{formatIndianPhone(r.phoneNumber)}</TableCell>
                  <TableCell>{r.userId}</TableCell>
                  <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="secondary">Export CSV</Button>
      </div>
    </Card>
  )
}
