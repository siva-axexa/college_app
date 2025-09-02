import { supabase } from './supabase'

// Upload file to Supabase storage
export async function uploadFile(
  bucket: string,
  file: File,
  path?: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = path || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file)

    if (error) {
      console.error('Upload error:', error)
      return { url: null, error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return { url: urlData.publicUrl, error: null }
  } catch (error: any) {
    console.error('Upload error:', error)
    return { url: null, error: error.message || 'Upload failed' }
  }
}

// Delete file from Supabase storage
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!filePath) {
      return { success: true, error: null } // Nothing to delete
    }

    // Extract file path from URL if it's a full URL
    let pathToDelete = filePath
    
    // Handle full Supabase URLs
    if (filePath.includes('supabase.co/storage/v1/object/public/')) {
      const urlParts = filePath.split('/storage/v1/object/public/')
      if (urlParts.length > 1) {
        const bucketAndPath = urlParts[1]
        const pathParts = bucketAndPath.split('/')
        if (pathParts.length > 1) {
          pathToDelete = pathParts.slice(1).join('/') // Remove bucket name, keep file path
        }
      }
    } else if (filePath.includes(`${bucket}/`)) {
      pathToDelete = filePath.split(`${bucket}/`)[1]
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([pathToDelete])

    if (error) {
      console.error('Delete error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error('Delete error:', error)
    return { success: false, error: error.message || 'Delete failed' }
  }
}

// Delete multiple files from storage
export async function deleteMultipleFiles(
  bucket: string,
  filePaths: string[]
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []
  
  for (const filePath of filePaths) {
    if (filePath) {
      const { success, error } = await deleteFile(bucket, filePath)
      if (!success && error) {
        errors.push(error)
      }
    }
  }

  return { success: errors.length === 0, errors }
}

// Extract file path from Supabase URL
export function extractFilePathFromUrl(url: string, bucket: string): string | null {
  if (!url) return null
  
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    const urlParts = url.split('/storage/v1/object/public/')
    if (urlParts.length > 1) {
      const bucketAndPath = urlParts[1]
      const pathParts = bucketAndPath.split('/')
      if (pathParts.length > 1 && pathParts[0] === bucket) {
        return pathParts.slice(1).join('/')
      }
    }
  }
  
  return null
}

// Upload multiple files
export async function uploadMultipleFiles(
  bucket: string,
  files: File[]
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = []
  const errors: string[] = []

  for (const file of files) {
    const { url, error } = await uploadFile(bucket, file)
    if (url) {
      urls.push(url)
    }
    if (error) {
      errors.push(error)
    }
  }

  return { urls, errors }
}

// Get file URL from storage
export function getFileUrl(bucket: string, filePath: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)
  
  return data.publicUrl
}
