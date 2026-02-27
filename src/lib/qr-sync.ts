/**
 * QR Code Sync for Chrysalide
 * Allows data transfer between devices via QR codes
 *
 * @version 1.0.0
 */

import { exportAllData, importAllData } from './db'

// Maximum data size for QR codes (roughly 2KB for reliable scanning)
const MAX_QR_DATA_SIZE = 2000

/**
 * Compress data using LZ-based compression
 * Uses native CompressionStream API when available
 */
async function compressData(data: string): Promise<string> {
  try {
    // Use CompressionStream if available (modern browsers)
    if ('CompressionStream' in window) {
      const encoder = new TextEncoder()
      const inputBytes = encoder.encode(data)

      const cs = new CompressionStream('gzip')
      const writer = cs.writable.getWriter()
      writer.write(inputBytes)
      writer.close()

      const compressedBytes = await new Response(cs.readable).arrayBuffer()

      // Convert to base64
      const base64 = btoa(String.fromCharCode(...new Uint8Array(compressedBytes)))

      return base64
    }
  } catch (error) {
    console.warn('[QRSync] CompressionStream not available, using raw data')
  }

  // Fallback: just base64 encode
  return btoa(unescape(encodeURIComponent(data)))
}

/**
 * Decompress data
 */
async function decompressData(compressed: string): Promise<string> {
  try {
    // Try decompressing with DecompressionStream
    if ('DecompressionStream' in window) {
      const binaryString = atob(compressed)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const ds = new DecompressionStream('gzip')
      const writer = ds.writable.getWriter()
      writer.write(bytes)
      writer.close()

      const decompressedBytes = await new Response(ds.readable).arrayBuffer()
      const decoder = new TextDecoder()
      return decoder.decode(decompressedBytes)
    }
  } catch (error) {
    // Fall through to base64 decode
  }

  // Fallback: just base64 decode
  return decodeURIComponent(escape(atob(compressed)))
}

/**
 * Data chunk for multi-QR transfer
 */
export interface DataChunk {
  /** Chunk index (0-based) */
  i: number
  /** Total number of chunks */
  t: number
  /** Session ID for grouping chunks */
  s: string
  /** Chunk data */
  d: string
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 8)
}

/**
 * Split data into chunks for QR codes
 */
export function splitIntoChunks(data: string, chunkSize: number = MAX_QR_DATA_SIZE): DataChunk[] {
  const sessionId = generateSessionId()
  const chunks: DataChunk[] = []
  const totalChunks = Math.ceil(data.length / chunkSize)

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize
    const end = start + chunkSize
    chunks.push({
      i,
      t: totalChunks,
      s: sessionId,
      d: data.substring(start, end),
    })
  }

  return chunks
}

/**
 * Reassemble chunks into complete data
 */
export function reassembleChunks(chunks: DataChunk[]): string | null {
  if (chunks.length === 0) return null

  // Verify all chunks are from same session
  const sessionId = chunks[0].s
  if (!chunks.every((c) => c.s === sessionId)) {
    console.error('[QRSync] Chunks from different sessions')
    return null
  }

  // Verify we have all chunks
  const totalExpected = chunks[0].t
  if (chunks.length !== totalExpected) {
    console.warn(`[QRSync] Missing chunks: have ${chunks.length}/${totalExpected}`)
    return null
  }

  // Sort by index and reassemble
  const sorted = [...chunks].sort((a, b) => a.i - b.i)
  return sorted.map((c) => c.d).join('')
}

/**
 * Generate QR code data for export
 * Returns array of chunk objects (may be multiple QR codes needed)
 */
export async function generateExportQRData(): Promise<{
  chunks: DataChunk[]
  totalChunks: number
  sessionId: string
}> {
  const data = await exportAllData()

  // Remove large data (photos, documents) to reduce size
  const lightData = {
    ...data,
    bloodTests: data.bloodTests.map((bt) => ({
      ...bt,
      documentPhoto: undefined, // Remove photos
    })),
    physicalProgress: data.physicalProgress.map((pp) => ({
      ...pp,
      photos: undefined, // Remove photos
    })),
  }

  const jsonString = JSON.stringify(lightData)
  const compressed = await compressData(jsonString)

  const chunks = splitIntoChunks(compressed)

  return {
    chunks,
    totalChunks: chunks.length,
    sessionId: chunks[0]?.s || '',
  }
}

/**
 * Import data from scanned QR chunks
 */
export async function importFromQRData(chunks: DataChunk[]): Promise<{
  success: boolean
  error?: string
  recordCount?: number
}> {
  try {
    const reassembled = reassembleChunks(chunks)
    if (!reassembled) {
      return { success: false, error: 'Données incomplètes' }
    }

    const jsonString = await decompressData(reassembled)
    const data = JSON.parse(jsonString)

    // Validate data structure
    if (!data.version || !data.medications) {
      return { success: false, error: 'Format de données invalide' }
    }

    // Import the data
    await importAllData(data)

    // Count imported records
    const recordCount =
      (data.medications?.length || 0) +
      (data.medicationLogs?.length || 0) +
      (data.bloodTests?.length || 0) +
      (data.appointments?.length || 0)

    return { success: true, recordCount }
  } catch (error) {
    console.error('[QRSync] Import error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur d'importation",
    }
  }
}

/**
 * Generate a sync URL for sharing
 * Uses a simple URL scheme for smaller datasets
 */
export async function generateSyncURL(): Promise<string | null> {
  const { chunks } = await generateExportQRData()

  // If data fits in one chunk, we can use a simple URL
  if (chunks.length === 1) {
    const encodedData = encodeURIComponent(chunks[0].d)
    return `chrysalide://sync?data=${encodedData}`
  }

  // Multiple chunks needed - return null (use QR code flow instead)
  return null
}

/**
 * Parse a sync URL
 */
export function parseSyncURL(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'chrysalide:') return null

    const data = parsed.searchParams.get('data')
    return data ? decodeURIComponent(data) : null
  } catch {
    return null
  }
}

/**
 * QR code scan state manager
 */
export class QRScanSession {
  private chunks: Map<number, DataChunk> = new Map()
  private sessionId: string | null = null
  private totalExpected: number = 0

  /**
   * Add a scanned chunk
   * @returns Progress info or completion status
   */
  addChunk(chunk: DataChunk): {
    complete: boolean
    progress: number
    total: number
    error?: string
  } {
    // First chunk sets the session
    if (!this.sessionId) {
      this.sessionId = chunk.s
      this.totalExpected = chunk.t
    }

    // Verify session match
    if (chunk.s !== this.sessionId) {
      return {
        complete: false,
        progress: this.chunks.size,
        total: this.totalExpected,
        error: "QR code d'une autre session détecté",
      }
    }

    // Add chunk
    this.chunks.set(chunk.i, chunk)

    return {
      complete: this.chunks.size === this.totalExpected,
      progress: this.chunks.size,
      total: this.totalExpected,
    }
  }

  /**
   * Get all collected chunks
   */
  getChunks(): DataChunk[] {
    return Array.from(this.chunks.values())
  }

  /**
   * Reset the session
   */
  reset(): void {
    this.chunks.clear()
    this.sessionId = null
    this.totalExpected = 0
  }

  /**
   * Check if session is complete
   */
  isComplete(): boolean {
    return this.chunks.size === this.totalExpected && this.totalExpected > 0
  }
}
