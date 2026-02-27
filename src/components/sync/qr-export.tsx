'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Loader2, QrCode, Check } from 'lucide-react'
import { generateExportQRData, type DataChunk } from '@/lib/qr-sync'

interface QRExportProps {
  onClose?: () => void
}

export function QRExport({ onClose }: QRExportProps) {
  const [loading, setLoading] = useState(true)
  const [chunks, setChunks] = useState<DataChunk[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    generateQRCodes()
  }, [])

  async function generateQRCodes() {
    try {
      setLoading(true)
      setError(null)

      const { chunks: exportChunks } = await generateExportQRData()
      setChunks(exportChunks)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  const currentChunk = chunks[currentIndex]
  const qrData = currentChunk ? JSON.stringify(currentChunk) : ''

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5" />
          Exporter via QR Code
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <p className="text-muted-foreground text-sm">Génération des QR codes...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={generateQRCodes} variant="outline">
              Réessayer
            </Button>
          </div>
        ) : (
          <>
            {/* QR Code Display */}
            <div className="flex justify-center rounded-lg bg-white p-4">
              <QRCodeSVG
                value={qrData}
                size={256}
                level="M"
                includeMargin
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>

            {/* Navigation */}
            {chunks.length > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {currentIndex + 1} / {chunks.length}
                  </span>
                  {currentIndex === chunks.length - 1 && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentIndex((i) => Math.min(chunks.length - 1, i + 1))}
                  disabled={currentIndex === chunks.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Instructions */}
            <div className="text-muted-foreground space-y-1 text-center text-sm">
              {chunks.length > 1 ? (
                <>
                  <p>Scannez chaque QR code dans l&apos;ordre sur l&apos;autre appareil.</p>
                  <p className="text-xs">
                    Session: <code className="bg-muted rounded px-1">{currentChunk?.s}</code>
                  </p>
                </>
              ) : (
                <p>Scannez ce QR code sur l&apos;autre appareil pour transférer vos données.</p>
              )}
            </div>

            {/* Progress dots */}
            {chunks.length > 1 && (
              <div className="flex justify-center gap-1.5">
                {chunks.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      i === currentIndex
                        ? 'bg-primary'
                        : i < currentIndex
                          ? 'bg-green-500'
                          : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {onClose && (
          <Button onClick={onClose} variant="outline" className="w-full">
            Fermer
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
