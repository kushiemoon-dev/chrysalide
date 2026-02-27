'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Check, Loader2, QrCode, X, AlertCircle } from 'lucide-react'
import { QRScanSession, importFromQRData, type DataChunk } from '@/lib/qr-sync'

interface QRImportProps {
  onComplete?: (recordCount: number) => void
  onClose?: () => void
}

export function QRImport({ onComplete, onClose }: QRImportProps) {
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [complete, setComplete] = useState(false)
  const [recordCount, setRecordCount] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sessionRef = useRef<QRScanSession>(new QRScanSession())
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setScanning(false)
  }, [])

  async function startCamera() {
    try {
      setError(null)
      setScanning(true)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        // Start scanning loop
        scanQRCode()
      }
    } catch (e) {
      setError("Impossible d'accéder à la caméra")
      setScanning(false)
    }
  }

  async function scanQRCode() {
    if (!videoRef.current || !canvasRef.current) {
      animationRef.current = requestAnimationFrame(scanQRCode)
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanQRCode)
      return
    }

    // Draw video frame to canvas
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    // Try to detect QR code using BarcodeDetector API
    try {
      if ('BarcodeDetector' in window) {
        type BarcodeDetectorCtor = new (opts: { formats: string[] }) => {
          detect(img: HTMLCanvasElement): Promise<{ rawValue: string }[]>
        }
        const detector = new (
          window as unknown as { BarcodeDetector: BarcodeDetectorCtor }
        ).BarcodeDetector({ formats: ['qr_code'] })
        const barcodes = await detector.detect(canvas)

        if (barcodes.length > 0) {
          const qrData = barcodes[0].rawValue
          await handleQRData(qrData)
        }
      }
    } catch (e) {
      // BarcodeDetector not available or error, continue scanning
    }

    // Continue scanning if not complete
    if (!sessionRef.current.isComplete()) {
      animationRef.current = requestAnimationFrame(scanQRCode)
    }
  }

  async function handleQRData(data: string) {
    try {
      const chunk = JSON.parse(data) as DataChunk

      // Validate chunk structure
      if (
        typeof chunk.i !== 'number' ||
        typeof chunk.t !== 'number' ||
        typeof chunk.s !== 'string' ||
        typeof chunk.d !== 'string'
      ) {
        return
      }

      const result = sessionRef.current.addChunk(chunk)

      setProgress({
        current: result.progress,
        total: result.total,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.complete) {
        stopCamera()
        await performImport()
      }
    } catch (e) {
      // Invalid QR data, ignore
    }
  }

  async function performImport() {
    setImporting(true)
    setError(null)

    try {
      const chunks = sessionRef.current.getChunks()
      const result = await importFromQRData(chunks)

      if (result.success) {
        setComplete(true)
        setRecordCount(result.recordCount || 0)
        onComplete?.(result.recordCount || 0)
      } else {
        setError(result.error || "Erreur d'importation")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'importation")
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    sessionRef.current.reset()
    setProgress({ current: 0, total: 0 })
    setError(null)
    setComplete(false)
    setRecordCount(0)
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5" />
          Importer via QR Code
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {complete ? (
          <div className="space-y-4 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Importation réussie !</h3>
              <p className="text-muted-foreground text-sm">
                {recordCount} enregistrements importés
              </p>
            </div>
            <Button onClick={onClose} className="w-full">
              Fermer
            </Button>
          </div>
        ) : importing ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <p className="text-muted-foreground text-sm">Importation en cours...</p>
          </div>
        ) : scanning ? (
          <>
            {/* Camera view */}
            <div className="relative aspect-square overflow-hidden rounded-lg bg-black">
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
                muted
              />

              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 rounded-lg border-2 border-white/50">
                  <div className="border-primary absolute top-0 left-0 h-8 w-8 rounded-tl-lg border-t-4 border-l-4" />
                  <div className="border-primary absolute top-0 right-0 h-8 w-8 rounded-tr-lg border-t-4 border-r-4" />
                  <div className="border-primary absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-4 border-l-4" />
                  <div className="border-primary absolute right-0 bottom-0 h-8 w-8 rounded-br-lg border-r-4 border-b-4" />
                </div>
              </div>

              {/* Hidden canvas for image processing */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Progress */}
            {progress.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression</span>
                  <span>
                    {progress.current} / {progress.total}
                  </span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg p-3 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button onClick={stopCamera} variant="outline" className="w-full">
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-4 py-8 text-center">
              <div className="bg-muted mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <Camera className="text-muted-foreground h-8 w-8" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  Scannez les QR codes générés sur l&apos;autre appareil pour importer vos données.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg p-3 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button onClick={startCamera} className="w-full">
              <Camera className="mr-2 h-4 w-4" />
              Démarrer le scan
            </Button>

            {onClose && (
              <Button onClick={onClose} variant="outline" className="w-full">
                Fermer
              </Button>
            )}

            <p className="text-muted-foreground text-center text-xs">
              Nécessite l&apos;accès à la caméra et un navigateur compatible avec l&apos;API
              BarcodeDetector.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
