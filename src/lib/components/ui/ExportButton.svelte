<script lang="ts">
  import { domToPng } from 'modern-screenshot'
  import { jsPDF } from 'jspdf'
  import { format } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import Download from '@lucide/svelte/icons/download'
  import FileImage from '@lucide/svelte/icons/file-image'
  import FileText from '@lucide/svelte/icons/file-text'
  import Loader2 from '@lucide/svelte/icons/loader-2'

  interface ExportData {
    marker: string
    label: string
    value: number
    unit: string
    targetMin?: number
    targetMax?: number
    status?: 'normal' | 'low' | 'high'
  }

  let {
    chartRef,
    title,
    subtitle,
    data,
    userName,
  }: {
    chartRef: HTMLDivElement | undefined
    title: string
    subtitle?: string
    data?: ExportData[]
    userName?: string
  } = $props()

  let exporting = $state<'png' | 'pdf' | null>(null)
  let open = $state(false)
  let container = $state<HTMLDivElement>()

  $effect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (container && !container.contains(e.target as Node)) open = false
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  })

  function exportFilename(ext: string) {
    return `${title.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.${ext}`
  }

  async function captureChart(): Promise<string | null> {
    if (!chartRef) return null
    try {
      return await domToPng(chartRef, { scale: 2, backgroundColor: '#1a1a2e' })
    } catch (error) {
      console.error('Chart capture error:', error)
      return null
    }
  }

  async function exportPNG() {
    open = false
    exporting = 'png'
    try {
      const dataUrl = await captureChart()
      if (!dataUrl) {
        alert(i18n.t('export.captureError'))
        return
      }
      const link = document.createElement('a')
      link.download = exportFilename('png')
      link.href = dataUrl
      link.click()
    } finally {
      exporting = null
    }
  }

  async function exportPDF() {
    open = false
    exporting = 'pdf'
    try {
      const dataUrl = await captureChart()
      if (!dataUrl) {
        alert(i18n.t('export.captureError'))
        return
      }

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 15

      pdf.setFontSize(18)
      pdf.setTextColor(40, 40, 40)
      pdf.text(title, margin, 20)

      if (subtitle) {
        pdf.setFontSize(12)
        pdf.setTextColor(100, 100, 100)
        pdf.text(subtitle, margin, 28)
      }

      pdf.setFontSize(10)
      pdf.setTextColor(80, 80, 80)
      const dateStr = format(new Date(), `dd MMMM yyyy '${i18n.t('export.atConnector')}' HH:mm`, {
        locale: getDateLocale(i18n.locale),
      })
      if (userName) {
        pdf.text(`${i18n.t('export.patient')} : ${userName}`, margin, 38)
        pdf.text(`${i18n.t('export.date')} : ${dateStr}`, margin, 44)
      } else {
        pdf.text(`${i18n.t('export.date')} : ${dateStr}`, margin, 38)
      }

      const img = new Image()
      img.src = dataUrl
      await new Promise((resolve) => {
        img.onload = resolve
      })

      const imgWidth = pageWidth - margin * 2
      const imgHeight = (img.height * imgWidth) / img.width / 2
      const imgY = userName ? 52 : 46

      pdf.addImage(dataUrl, 'PNG', margin, imgY, imgWidth, imgHeight)

      if (data && data.length > 0) {
        const tableY = imgY + imgHeight + 15

        pdf.setFontSize(12)
        pdf.setTextColor(40, 40, 40)
        pdf.text(i18n.t('export.lastValues'), margin, tableY)

        pdf.setFontSize(9)
        const colWidths = [50, 35, 50, 30]
        const headers = [
          i18n.t('export.marker'),
          i18n.t('export.value'),
          i18n.t('export.target'),
          i18n.t('export.statusLabel'),
        ]
        let y = tableY + 8

        pdf.setTextColor(100, 100, 100)
        let x = margin
        headers.forEach((header, i) => {
          pdf.text(header, x, y)
          x += colWidths[i]!
        })

        y += 6
        pdf.setDrawColor(200, 200, 200)
        pdf.line(margin, y - 2, pageWidth - margin, y - 2)

        pdf.setTextColor(40, 40, 40)
        for (const row of data) {
          x = margin
          pdf.text(row.label, x, y)
          x += colWidths[0]!

          pdf.text(`${row.value} ${row.unit}`, x, y)
          x += colWidths[1]!

          if (row.targetMin !== undefined && row.targetMax !== undefined) {
            pdf.text(`${row.targetMin} - ${row.targetMax} ${row.unit}`, x, y)
          } else {
            pdf.text('-', x, y)
          }
          x += colWidths[2]!

          if (row.status === 'normal') {
            pdf.setTextColor(34, 197, 94)
            pdf.text(i18n.t('export.statusNormal'), x, y)
          } else if (row.status === 'low') {
            pdf.setTextColor(234, 179, 8)
            pdf.text(i18n.t('export.statusLow'), x, y)
          } else if (row.status === 'high') {
            pdf.setTextColor(239, 68, 68)
            pdf.text(i18n.t('export.statusHigh'), x, y)
          } else {
            pdf.setTextColor(150, 150, 150)
            pdf.text('-', x, y)
          }
          pdf.setTextColor(40, 40, 40)

          y += 6
        }
      }

      const pageHeight = pdf.internal.pageSize.getHeight()
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      pdf.text(i18n.t('export.generatedBy'), margin, pageHeight - 10)
      pdf.text(i18n.t('export.disclaimer'), margin, pageHeight - 6)

      pdf.save(exportFilename('pdf'))
    } finally {
      exporting = null
    }
  }
</script>

<div class="export-menu" bind:this={container}>
  <button
    type="button"
    class="trigger"
    disabled={!!exporting}
    onclick={() => (open = !open)}
    aria-label={i18n.t('export.button')}
  >
    {#if exporting}
      <Loader2 size={16} class="spin" />
    {:else}
      <Download size={16} />
    {/if}
  </button>

  {#if open}
    <div class="dropdown">
      <button type="button" class="dropdown-item" onclick={exportPNG} disabled={!!exporting}>
        <FileImage size={16} />
        {i18n.t('export.asPNG')}
      </button>
      <button type="button" class="dropdown-item" onclick={exportPDF} disabled={!!exporting}>
        <FileText size={16} />
        {i18n.t('export.asPDF')}
      </button>
    </div>
  {/if}
</div>

<style>
  .export-menu {
    position: relative;
  }
  .trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--ink-soft);
    cursor: pointer;
  }
  .trigger:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .trigger :global(.spin) {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .dropdown {
    position: absolute;
    z-index: 20;
    top: calc(100% + 4px);
    right: 0;
    min-width: 160px;
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 10px;
    box-shadow: 0 4px 16px var(--shadow);
    overflow: hidden;
  }
  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 9px 12px;
    border: none;
    background: transparent;
    color: var(--ink);
    font-family: inherit;
    font-size: 13px;
    text-align: left;
    cursor: pointer;
  }
  .dropdown-item:hover {
    background: var(--page);
  }
  .dropdown-item:disabled {
    opacity: 0.6;
    cursor: default;
  }
</style>
