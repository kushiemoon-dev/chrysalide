'use client'

/**
 * Known limitation as of v0.2.2:
 * Exporting Recharts (SVG) charts as images doesn't work correctly
 * with DOM capture libraries (html2canvas, dom-to-image, modern-screenshot).
 * The data table in the PDF works, but the chart image is corrupted.
 *
 * Possible future solutions:
 * - Use a server-side API with Puppeteer/Playwright
 * - Implement native Canvas rendering in Recharts
 * - Wait for better compatibility of capture libs with modern CSS (lab(), oklch())
 */

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { getDateLocale } from '@/i18n/date-locale'
import type { Locale } from '@/i18n/config'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Download, FileImage, FileText, Loader2 } from 'lucide-react'
import { domToPng } from 'modern-screenshot'
import { jsPDF } from 'jspdf'
import { format } from 'date-fns'

interface ExportData {
  marker: string
  label: string
  value: number
  unit: string
  targetMin?: number
  targetMax?: number
  status?: 'normal' | 'low' | 'high'
}

interface ExportButtonProps {
  chartRef: React.RefObject<HTMLDivElement | null>
  title: string
  subtitle?: string
  data?: ExportData[]
  userName?: string
}

export function ExportButton({ chartRef, title, subtitle, data, userName }: ExportButtonProps) {
  const t = useTranslations('export')
  const locale = useLocale()
  const dateLocale = getDateLocale(locale as Locale)
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null)
  const [open, setOpen] = useState(false)

  async function captureChart(): Promise<string | null> {
    if (!chartRef.current) return null

    try {
      const dataUrl = await domToPng(chartRef.current, {
        scale: 2,
        backgroundColor: '#1a1a2e',
      })
      return dataUrl
    } catch (error) {
      console.error('Chart capture error:', error)
      return null
    }
  }

  async function exportPNG() {
    setOpen(false)
    setExporting('png')
    try {
      const dataUrl = await captureChart()
      if (!dataUrl) {
        alert(t('captureError'))
        return
      }

      const link = document.createElement('a')
      link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.png`
      link.href = dataUrl
      link.click()
    } finally {
      setExporting(null)
    }
  }

  async function exportPDF() {
    setOpen(false)
    setExporting('pdf')
    try {
      const dataUrl = await captureChart()
      if (!dataUrl) {
        alert(t('captureError'))
        return
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 15

      // Header
      pdf.setFontSize(18)
      pdf.setTextColor(40, 40, 40)
      pdf.text(title, margin, 20)

      if (subtitle) {
        pdf.setFontSize(12)
        pdf.setTextColor(100, 100, 100)
        pdf.text(subtitle, margin, 28)
      }

      // Name + Date
      pdf.setFontSize(10)
      pdf.setTextColor(80, 80, 80)
      const dateStr = format(new Date(), `dd MMMM yyyy '${t('atConnector')}' HH:mm`, {
        locale: dateLocale,
      })
      if (userName) {
        pdf.text(`${t('patient')} : ${userName}`, margin, 38)
        pdf.text(`${t('date')} : ${dateStr}`, margin, 44)
      } else {
        pdf.text(`${t('date')} : ${dateStr}`, margin, 38)
      }

      // Chart - compute dimensions
      const img = new Image()
      img.src = dataUrl
      await new Promise((resolve) => {
        img.onload = resolve
      })

      const imgWidth = pageWidth - margin * 2
      const imgHeight = (img.height * imgWidth) / img.width / 2 // /2 because scale: 2
      const imgY = userName ? 52 : 46

      pdf.addImage(dataUrl, 'PNG', margin, imgY, imgWidth, imgHeight)

      // Values table
      if (data && data.length > 0) {
        const tableY = imgY + imgHeight + 15

        pdf.setFontSize(12)
        pdf.setTextColor(40, 40, 40)
        pdf.text(t('lastValues'), margin, tableY)

        pdf.setFontSize(9)
        const colWidths = [50, 35, 50, 30]
        const headers = [t('marker'), t('value'), t('target'), t('statusLabel')]
        let y = tableY + 8

        // Table headers
        pdf.setTextColor(100, 100, 100)
        let x = margin
        headers.forEach((header, i) => {
          pdf.text(header, x, y)
          x += colWidths[i]
        })

        y += 6
        pdf.setDrawColor(200, 200, 200)
        pdf.line(margin, y - 2, pageWidth - margin, y - 2)

        // Data
        pdf.setTextColor(40, 40, 40)
        for (const row of data) {
          x = margin
          pdf.text(row.label, x, y)
          x += colWidths[0]

          pdf.text(`${row.value} ${row.unit}`, x, y)
          x += colWidths[1]

          if (row.targetMin !== undefined && row.targetMax !== undefined) {
            pdf.text(`${row.targetMin} - ${row.targetMax} ${row.unit}`, x, y)
          } else {
            pdf.text('-', x, y)
          }
          x += colWidths[2]

          if (row.status === 'normal') {
            pdf.setTextColor(34, 197, 94)
            pdf.text(t('statusNormal'), x, y)
          } else if (row.status === 'low') {
            pdf.setTextColor(234, 179, 8)
            pdf.text(t('statusLow'), x, y)
          } else if (row.status === 'high') {
            pdf.setTextColor(239, 68, 68)
            pdf.text(t('statusHigh'), x, y)
          } else {
            pdf.setTextColor(150, 150, 150)
            pdf.text('-', x, y)
          }
          pdf.setTextColor(40, 40, 40)

          y += 6
        }
      }

      // Footer
      const pageHeight = pdf.internal.pageSize.getHeight()
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      pdf.text(t('generatedBy'), margin, pageHeight - 10)
      pdf.text(t('disclaimer'), margin, pageHeight - 6)

      // Download
      pdf.save(
        `${title.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      )
    } finally {
      setExporting(null)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={!!exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {t('button')}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        <button
          onClick={exportPNG}
          disabled={!!exporting}
          className="hover:bg-muted flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors disabled:opacity-50"
        >
          <FileImage className="mr-2 h-4 w-4" />
          {t('asPNG')}
        </button>
        <button
          onClick={exportPDF}
          disabled={!!exporting}
          className="hover:bg-muted flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors disabled:opacity-50"
        >
          <FileText className="mr-2 h-4 w-4" />
          {t('asPDF')}
        </button>
      </PopoverContent>
    </Popover>
  )
}
