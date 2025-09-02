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
    // Extract file path from URL if it's a full URL
    let pathToDelete = filePath
    if (filePath.includes(`${bucket}/`)) {
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
