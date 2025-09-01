"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  course: string
}

const MOCK_USERS: User[] = [
  { id: "u_01", firstName: "Aarav", lastName: "Shah", email: "aarav@example.com", course: "Computer Science" },
  { id: "u_02", firstName: "Maya", lastName: "Patel", email: "maya@example.com", course: "Mechanical Engg" },
  { id: "u_03", firstName: "Ethan", lastName: "Gray", email: "ethang@example.com", course: "B. Com" },
]

export default function UsersTable() {
  const [q, setQ] = useState("")
  const rows = useMemo(() => {
    const v = q.toLowerCase().trim()
    if (!v) return MOCK_USERS
    return MOCK_USERS.filter(
      (r) =>
        r.firstName.toLowerCase().includes(v) ||
        r.lastName.toLowerCase().includes(v) ||
        r.email.toLowerCase().includes(v) ||
        r.course.toLowerCase().includes(v),
    )
  }, [q])

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-medium">Users</h2>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, course"
          className="w-[260px]"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>College Course</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.firstName}</TableCell>
                <TableCell>{r.lastName}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell>{r.course}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
