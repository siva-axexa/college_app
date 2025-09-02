"use client"

import { useState, useMemo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  course: string
  phoneNumber?: string
  createdAt?: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

const COURSE_OPTIONS = [
  { value: 'ALL', label: 'All Courses' },
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'LAW', label: 'Law' },
  { value: 'ARTS', label: 'Arts & Science' }
]

export default function UsersTable() {
  const [q, setQ] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("ALL")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Fetch users data from API
  const fetchUsers = async (page: number = 1, search: string = '', course: string = 'ALL') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(course !== 'ALL' && { course })
      })
      
      const response = await fetch(`/api/admin/users?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch users data')
      }
      
      const result = await response.json()
      if (result.success) {
        setUsers(result.data)
        setPagination(result.pagination)
      } else {
        throw new Error(result.error || 'Failed to fetch users data')
      }
    } catch (err: any) {
      console.error('Error fetching users:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchUsers(1, q, selectedCourse)
  }, [])

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1, q, selectedCourse)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [q])

  // Handle course filter change
  useEffect(() => {
    fetchUsers(1, q, selectedCourse)
  }, [selectedCourse])

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage, q, selectedCourse)
  }

  // Remove client-side filtering since we're doing server-side search
  const rows = users

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-medium">Users</h2>
        <div className="flex items-center gap-2">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COURSE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email"
            className="w-[200px]"
          />
        </div>
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
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>College Course</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.firstName}</TableCell>
                  <TableCell>{r.lastName}</TableCell>
                  <TableCell>{r.email || 'N/A'}</TableCell>
                  <TableCell>{r.course}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrev || loading}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNext || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}
