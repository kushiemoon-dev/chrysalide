'use client'

/**
 * Limitation connue v0.2.2:
 * L'export d'image des graphiques Recharts (SVG) ne fonctionne pas correctement
 * avec les bibliothèques de capture DOM (html2canvas, dom-to-image, modern-screenshot).
 * Le tableau de données dans le PDF fonctionne, mais l'image du graphique est corrompue.
 *
 * Solutions futures possibles:
 * - Utiliser une API serveur avec Puppeteer/Playwright
 * - Implémenter un rendu Canvas natif dans Recharts
 * - Attendre une meilleure compatibilité des libs de capture avec les CSS modernes (lab(), oklch())
 */

import { useState } from 'react'
import { useLocale } from 'next-intl'
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
      console.error('Erreur capture graphique:', error)
      return null
    }
  }

  async function exportPNG() {
    setOpen(false)
    setExporting('png')
    try {
      const dataUrl = await captureChart()
      if (!dataUrl) {
        alert('Erreur lors de la capture du graphique')
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
        alert('Erreur lors de la capture du graphique')
        return
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 15

      // En-tête
      pdf.setFontSize(18)
      pdf.setTextColor(40, 40, 40)
      pdf.text(title, margin, 20)

      if (subtitle) {
        pdf.setFontSize(12)
        pdf.setTextColor(100, 100, 100)
        pdf.text(subtitle, margin, 28)
      }

      // Nom + Date
      pdf.setFontSize(10)
      pdf.setTextColor(80, 80, 80)
      const dateStr = format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: dateLocale })
      if (userName) {
        pdf.text(`Patient·e : ${userName}`, margin, 38)
        pdf.text(`Date : ${dateStr}`, margin, 44)
      } else {
        pdf.text(`Date : ${dateStr}`, margin, 38)
      }

      // Graphique - calculer les dimensions
      const img = new Image()
      img.src = dataUrl
      await new Promise((resolve) => {
        img.onload = resolve
      })

      const imgWidth = pageWidth - margin * 2
      const imgHeight = (img.height * imgWidth) / img.width / 2 // /2 car scale: 2
      const imgY = userName ? 52 : 46

      pdf.addImage(dataUrl, 'PNG', margin, imgY, imgWidth, imgHeight)

      // Tableau des valeurs
      if (data && data.length > 0) {
        const tableY = imgY + imgHeight + 15

        pdf.setFontSize(12)
        pdf.setTextColor(40, 40, 40)
        pdf.text('Dernières valeurs', margin, tableY)

        pdf.setFontSize(9)
        const colWidths = [50, 35, 50, 30]
        const headers = ['Marqueur', 'Valeur', 'Cible', 'Statut']
        let y = tableY + 8

        // En-têtes du tableau
        pdf.setTextColor(100, 100, 100)
        let x = margin
        headers.forEach((header, i) => {
          pdf.text(header, x, y)
          x += colWidths[i]
        })

        y += 6
        pdf.setDrawColor(200, 200, 200)
        pdf.line(margin, y - 2, pageWidth - margin, y - 2)

        // Données
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
            pdf.text('Normal', x, y)
          } else if (row.status === 'low') {
            pdf.setTextColor(234, 179, 8)
            pdf.text('Bas', x, y)
          } else if (row.status === 'high') {
            pdf.setTextColor(239, 68, 68)
            pdf.text('Élevé', x, y)
          } else {
            pdf.setTextColor(150, 150, 150)
            pdf.text('-', x, y)
          }
          pdf.setTextColor(40, 40, 40)

          y += 6
        }
      }

      // Pied de page
      const pageHeight = pdf.internal.pageSize.getHeight()
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      pdf.text('Généré par Chrysalide - chrysalide.app', margin, pageHeight - 10)
      pdf.text(
        'Ce document est informatif et ne remplace pas un avis médical.',
        margin,
        pageHeight - 6
      )

      // Télécharger
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
          Exporter
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        <button
          onClick={exportPNG}
          disabled={!!exporting}
          className="hover:bg-muted flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors disabled:opacity-50"
        >
          <FileImage className="mr-2 h-4 w-4" />
          Exporter en PNG
        </button>
        <button
          onClick={exportPDF}
          disabled={!!exporting}
          className="hover:bg-muted flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors disabled:opacity-50"
        >
          <FileText className="mr-2 h-4 w-4" />
          Exporter en PDF
        </button>
      </PopoverContent>
    </Popover>
  )
}
