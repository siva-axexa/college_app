"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, Eye, EyeOff } from "lucide-react"
import { College } from "@/lib/supabase"
import CollegeForm from "./college-form"

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' }
]

export default function CollegesTable() {
  const [q, setQ] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("ALL")
  const [colleges, setColleges] = useState<College[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCollege, setEditingCollege] = useState<College | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Fetch colleges data from API
  const fetchColleges = async (page: number = 1, search: string = '', status: string = 'ALL') => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(status !== 'ALL' && { status })
      })
      
      const response = await fetch(`/api/colleges?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch colleges data')
      }
      
      const result = await response.json()
      if (result.success) {
        setColleges(result.data)
        setPagination(result.pagination)
      } else {
        throw new Error(result.error || 'Failed to fetch colleges data')
      }
    } catch (err: any) {
      console.error('Error fetching colleges:', err)
      setError(err.message)
      setColleges([])
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchColleges(1, q, selectedStatus)
  }, [])

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchColleges(1, q, selectedStatus)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [q])

  // Handle status filter change
  useEffect(() => {
    fetchColleges(1, q, selectedStatus)
  }, [selectedStatus])

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    fetchColleges(newPage, q, selectedStatus)
  }

  // Handle form submission
  const handleFormSubmit = async () => {
    setShowForm(false)
    setEditingCollege(null)
    await fetchColleges(pagination.page, q, selectedStatus)
  }

  // Handle edit college
  const handleEdit = async (college: College) => {
    try {
      setLoading(true)
      // Fetch full college data for editing
      const response = await fetch(`/api/colleges/${college.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch college details')
      }
      const result = await response.json()
      if (result.success) {
        console.log('Full college data for editing:', result.data) // Debug log
        setEditingCollege(result.data)
        setShowForm(true)
      } else {
        throw new Error(result.error || 'Failed to fetch college details')
      }
    } catch (err: any) {
      console.error('Error fetching college for edit:', err)
      alert('Failed to load college data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle delete college
  const handleDelete = async (collegeId: number) => {
    if (!confirm('Are you sure you want to delete this college?')) {
      return
    }

    try {
      const response = await fetch(`/api/colleges/${collegeId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete college')
      }

      const result = await response.json()
      if (result.success) {
        await fetchColleges(pagination.page, q, selectedStatus)
      } else {
        throw new Error(result.error || 'Failed to delete college')
      }
    } catch (err: any) {
      console.error('Error deleting college:', err)
      alert('Failed to delete college: ' + err.message)
    }
  }

  // Handle toggle status
  const handleToggleStatus = async (college: College) => {
    try {
      const response = await fetch(`/api/colleges/${college.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...college,
          status: !college.status
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update college status')
      }

      const result = await response.json()
      if (result.success) {
        await fetchColleges(pagination.page, q, selectedStatus)
      } else {
        throw new Error(result.error || 'Failed to update college status')
      }
    } catch (err: any) {
      console.error('Error updating college status:', err)
      alert('Failed to update college status: ' + err.message)
    }
  }

  if (showForm) {
    return (
      <CollegeForm 
        college={editingCollege}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setShowForm(false)
          setEditingCollege(null)
        }}
      />
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-medium">Colleges</h2>
        <div className="flex items-center gap-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search colleges..."
            className="w-[200px]"
          />
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add College
          </Button>
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
              <TableHead>Logo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>NIRF Ranking</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : colleges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No colleges found
                </TableCell>
              </TableRow>
            ) : (
              colleges.map((college) => (
                <TableRow key={college.id}>
                  <TableCell>
                    {college.logo ? (
                      <img 
                        src={college.logo} 
                        alt={`${college.name} logo`}
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">
                        No Logo
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {college.name || 'Unnamed College'}
                  </TableCell>
                  <TableCell>{college.location || 'N/A'}</TableCell>
                  <TableCell>
                    {college.nirfRanking ? `#${college.nirfRanking}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={college.status ? "default" : "secondary"}>
                      {college.status ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(college.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(college)}
                        className="flex items-center gap-1"
                      >
                        {college.status ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(college)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(college.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
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
