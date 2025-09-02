"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import RichTextEditor from "@/components/ui/rich-text-editor"
import { ArrowLeft, Upload, X, Plus, ImageIcon } from "lucide-react"
import { College } from "@/lib/supabase"
import { uploadFile, uploadMultipleFiles, deleteFile } from "@/lib/storage"

interface CollegeFormProps {
  college?: College | null
  onSubmit: () => void
  onCancel: () => void
}

export default function CollegeForm({ college, onSubmit, onCancel }: CollegeFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    about: '',
    courseAndFees: '',
    hostel: '',
    placementAndScholarship: '',
    nirfRanking: '',
    logo: '',
    images: [] as string[],
    status: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const imagesInputRef = useRef<HTMLInputElement>(null)

  // Initialize form data when college prop changes
  useEffect(() => {
    if (college) {
      console.log('Loading college data:', college) // Debug log
      setFormData({
        name: college.name || '',
        location: college.location || '',
        about: college.about || '',
        courseAndFees: college.courseAndFees || '',
        hostel: college.hostel || '',
        placementAndScholarship: college.placementAndScholarship || '',
        nirfRanking: college.nirfRanking?.toString() || '',
        logo: college.logo || '',
        images: college.images || [],
        status: college.status ?? true
      })
    }
  }, [college])

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle add image URL
  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()]
      }))
      setNewImageUrl('')
    }
  }

  // Handle remove image
  const handleRemoveImage = async (index: number) => {
    const imageUrl = formData.images[index]
    
    // Delete from storage if it's a Supabase URL
    if (imageUrl && imageUrl.includes('supabase.co/storage/v1/object/public/college_images/')) {
      try {
        await deleteFile('college_images', imageUrl)
      } catch (error) {
        console.error('Failed to delete image from storage:', error)
        // Continue with UI update even if storage deletion fails
      }
    }
    
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  // Handle logo change (delete old logo if exists)
  const handleLogoChange = async (newLogoUrl: string) => {
    const oldLogoUrl = formData.logo
    
    // Delete old logo from storage if it exists and is different
    if (oldLogoUrl && oldLogoUrl !== newLogoUrl && oldLogoUrl.includes('supabase.co/storage/v1/object/public/college_logo/')) {
      try {
        await deleteFile('college_logo', oldLogoUrl)
      } catch (error) {
        console.error('Failed to delete old logo from storage:', error)
      }
    }
    
    handleChange('logo', newLogoUrl)
  }

  // Handle logo file upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const { url, error } = await uploadFile('college_logo', file)
      if (error) {
        throw new Error(error)
      }
      if (url) {
        await handleLogoChange(url)
      }
    } catch (err: any) {
      setError('Failed to upload logo: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  // Handle multiple images upload
  const handleImagesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    try {
      const { urls, errors } = await uploadMultipleFiles('college_images', files)
      
      if (errors.length > 0) {
        setError('Some images failed to upload: ' + errors.join(', '))
      }
      
      if (urls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...urls]
        }))
      }
    } catch (err: any) {
      setError('Failed to upload images: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validation
      if (!formData.name.trim() || !formData.location.trim()) {
        throw new Error('Name and location are required')
      }

      const url = college ? `/api/colleges/${college.id}` : '/api/colleges'
      const method = college ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          nirfRanking: formData.nirfRanking ? parseInt(formData.nirfRanking) : null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save college')
      }

      const result = await response.json()
      if (result.success) {
        onSubmit()
      } else {
        throw new Error(result.error || 'Failed to save college')
      }
    } catch (err: any) {
      console.error('Error saving college:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-lg font-medium">
          {college ? 'Edit College' : 'Add New College'}
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          Error: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">College Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter college name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Enter location"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nirfRanking">NIRF Ranking</Label>
            <Input
              id="nirfRanking"
              type="number"
              value={formData.nirfRanking}
              onChange={(e) => handleChange('nirfRanking', e.target.value)}
              placeholder="Enter NIRF ranking"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={formData.status}
                onCheckedChange={(checked) => handleChange('status', checked)}
              />
              <Label htmlFor="status">{formData.status ? 'Active' : 'Inactive'}</Label>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <Label>College Logo</Label>
          <div className="flex gap-2">
            <Input
              value={formData.logo}
              onChange={(e) => handleLogoChange(e.target.value)}
              placeholder="Enter logo URL or upload file"
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => logoInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          {formData.logo && (
            <div className="mt-2">
              <img 
                src={formData.logo} 
                alt="Logo preview" 
                className="w-16 h-16 rounded object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Images */}
        <div className="space-y-2">
          <Label>College Images</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Enter image URL"
              className="flex-1"
            />
            <Button type="button" onClick={handleAddImage} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => imagesInputRef.current?.click()}
              disabled={uploading}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
          <input
            ref={imagesInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImagesUpload}
            className="hidden"
          />
          {uploading && (
            <p className="text-sm text-blue-600">Uploading files...</p>
          )}
          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {formData.images.map((imageUrl, index) => (
                <div key={index} className="relative">
                  <img 
                    src={imageUrl} 
                    alt={`College image ${index + 1}`}
                    className="w-full h-20 rounded object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rich Text Fields */}
        <div className="space-y-6">
          <RichTextEditor
            id="about"
            label="About College"
            value={formData.about}
            onChange={(value) => handleChange('about', value)}
            placeholder="Enter college description, history, facilities, etc."
          />

          <RichTextEditor
            id="courseAndFees"
            label="Courses & Fees"
            value={formData.courseAndFees}
            onChange={(value) => handleChange('courseAndFees', value)}
            placeholder="Enter course details, fees structure, etc."
          />

          <RichTextEditor
            id="hostel"
            label="Hostel Information"
            value={formData.hostel}
            onChange={(value) => handleChange('hostel', value)}
            placeholder="Enter hostel facilities, fees, rules, etc."
          />

          <RichTextEditor
            id="placementAndScholarship"
            label="Placement & Scholarship"
            value={formData.placementAndScholarship}
            onChange={(value) => handleChange('placementAndScholarship', value)}
            placeholder="Enter placement statistics, scholarship details, etc."
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (college ? 'Update College' : 'Create College')}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
