import crypto from 'node:crypto'

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId: string
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment variables are not configured')
  }

  const timestamp = Math.round(new Date().getTime() / 1000)

  // Alphabetically ordered parameters for signature: folder, public_id, timestamp
  const parameterString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`
  const signature = crypto
    .createHash('sha1')
    .update(parameterString + apiSecret)
    .digest('hex')

  const base64File = `data:image/jpeg;base64,${buffer.toString('base64')}`

  const formData = new URLSearchParams()
  formData.append('file', base64File)
  formData.append('folder', folder)
  formData.append('public_id', publicId)
  formData.append('timestamp', timestamp.toString())
  formData.append('api_key', apiKey)
  formData.append('signature', signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Cloudinary upload failed: ${response.status} — ${errorText}`)
  }

  const data = (await response.json()) as any
  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment variables are not configured')
  }

  const timestamp = Math.round(new Date().getTime() / 1000)
  const parameterString = `public_id=${publicId}&timestamp=${timestamp}`
  const signature = crypto
    .createHash('sha1')
    .update(parameterString + apiSecret)
    .digest('hex')

  const formData = new URLSearchParams()
  formData.append('public_id', publicId)
  formData.append('timestamp', timestamp.toString())
  formData.append('api_key', apiKey)
  formData.append('signature', signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Cloudinary destroy failed: ${response.status} — ${errorText}`)
  }
}
