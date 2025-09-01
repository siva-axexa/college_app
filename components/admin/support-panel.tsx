"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Send } from "lucide-react"

type User = {
  id: string
  name: string
  email: string
  phone: string
  course: "engineering" | "arts" | "medical" | "law"
}

type ChatMsg = { role: "user" | "admin"; text: string; at: string }

const MOCK_USERS: User[] = [
  { id: "u_01", name: "Maya Rao", email: "maya@example.com", phone: "+91 98765 43210", course: "engineering" },
  { id: "u_02", name: "Karan Singh", email: "karan@example.com", phone: "+91 99876 54321", course: "arts" },
  { id: "u_03", name: "Liam Das", email: "liam@example.com", phone: "+91 91234 56789", course: "medical" },
]

// Simple Indian phone formatter reused here for consistency
function formatIndianPhone(raw: string) {
  const digits = raw.replace(/[^\d]/g, "")
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  if (digits.length === 12 && digits.startsWith("91")) {
    const local = digits.slice(2)
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`
  }
  if (raw.trim().startsWith("+91")) {
    const local = digits.replace(/^91/, "").slice(-10)
    if (local.length === 10) return `+91 ${local.slice(0, 5)} ${local.slice(5)}`
  }
  return raw
}

export default function SupportPanel() {
  const [q, setQ] = useState("")
  const users = useMemo(() => {
    const v = q.toLowerCase().trim()
    if (!v) return MOCK_USERS
    return MOCK_USERS.filter(
      (u) =>
        u.name.toLowerCase().includes(v) ||
        u.email.toLowerCase().includes(v) ||
        formatIndianPhone(u.phone).toLowerCase().includes(v) ||
        u.course.toLowerCase().includes(v),
    )
  }, [q])

  // Hold selected user and separate chat threads per user
  const [selectedUserId, setSelectedUserId] = useState<string | null>(MOCK_USERS[0]?.id ?? null)
  const [chatsByUser, setChatsByUser] = useState<Record<string, ChatMsg[]>>({
    u_01: [
      { role: "user", text: "Hi, I need help with my payment.", at: "10:00" },
      { role: "admin", text: "Sure, could you share the error?", at: "10:02" },
    ],
    u_02: [{ role: "user", text: "PDF upload failed yesterday.", at: "09:15" }],
    u_03: [{ role: "user", text: "How to change my phone number?", at: "08:30" }],
  })

  const selected = useMemo(() => MOCK_USERS.find((u) => u.id === selectedUserId) || null, [selectedUserId])
  const chat = chatsByUser[selectedUserId ?? ""] ?? []
  const [msg, setMsg] = useState("")

  const send = () => {
    const v = msg.trim()
    if (!v || !selectedUserId) return
    setChatsByUser((prev) => ({
      ...prev,
      [selectedUserId]: [
        ...(prev[selectedUserId] ?? []),
        { role: "admin", text: v, at: new Date().toLocaleTimeString() },
      ],
    }))
    setMsg("")
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Left: Users list */}
      <Card className="p-4">
        <div className="mb-3">
          <h2 className="text-lg font-medium">Users</h2>
          <p className="text-sm text-muted-foreground">Search and select a user to start a 1:1 chat.</p>
        </div>
        <div className="mb-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, course" />
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Course</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u.id}
                  className={selectedUserId === u.id ? "bg-muted/50" : ""}
                  onClick={() => setSelectedUserId(u.id)}
                >
                  <TableCell className="max-w-[160px] truncate">{u.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{u.email}</TableCell>
                  <TableCell>{formatIndianPhone(u.phone)}</TableCell>
                  <TableCell className="capitalize">{u.course}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Right: 1:1 Chat */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-medium">1:1 Chat</h2>
            {selected ? (
              <p className="text-sm text-muted-foreground">
                {selected.name} • {selected.email} • {formatIndianPhone(selected.phone)} • {selected.course}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No user selected</p>
            )}
          </div>
        </div>
        <div className="border rounded-md h-[320px] p-3 overflow-y-auto space-y-2">
          {chat.map((c, i) => (
            <div
              key={i}
              className={`max-w-[75%] p-2 rounded-md ${
                c.role === "admin" ? "ml-auto bg-primary text-primary-foreground" : "mr-auto bg-muted"
              }`}
            >
              <div className="text-sm">{c.text}</div>
              <div
                className={`text-[11px] mt-1 ${c.role === "admin" ? "text-primary-foreground/80" : "text-muted-foreground"}`}
              >
                {c.role} • {c.at}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Input
            placeholder={selected ? `Message ${selected.name}…` : "Select a user to start chatting…"}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send()
            }}
            disabled={!selected}
          />
          <Button onClick={send} disabled={!selected}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </Card>
    </div>
  )
}
