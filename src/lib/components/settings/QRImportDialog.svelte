<script lang="ts">
  import { QRScanSession, importFromQRData, type DataChunk } from '$lib/qr-sync'
  import { i18n } from '$lib/i18n.svelte'
  import QrCode from '@lucide/svelte/icons/qr-code'
  import Camera from '@lucide/svelte/icons/camera'
  import Check from '@lucide/svelte/icons/check'
  import Loader2 from '@lucide/svelte/icons/loader-2'
  import X from '@lucide/svelte/icons/x'
  import AlertCircle from '@lucide/svelte/icons/alert-circle'

  let {
    open = $bindable(false),
    oncomplete,
  }: { open?: boolean; oncomplete?: (recordCount: number) => void } = $props()

  let dialogEl = $state<HTMLDialogElement>()
  let videoEl = $state<HTMLVideoElement>()
  let canvasEl = $state<HTMLCanvasElement>()

  let scanning = $state(false)
  let progress = $state({ current: 0, total: 0 })
  let error = $state<string | null>(null)
  let importing = $state(false)
  let complete = $state(false)
  let recordCount = $state(0)

  let session = new QRScanSession()
  let stream: MediaStream | null = null
  let animationHandle: number | null = null

  $effect(() => {
    if (!dialogEl) return
    if (open) dialogEl.showModal()
    else dialogEl.close()
  })

  $effect(() => {
    if (open) {
      session = new QRScanSession()
      scanning = false
      progress = { current: 0, total: 0 }
      error = null
      importing = false
      complete = false
      recordCount = 0
    }
    return () => stopCamera()
  })

  function stopCamera() {
    if (animationHandle !== null) {
      cancelAnimationFrame(animationHandle)
      animationHandle = null
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      stream = null
    }
    scanning = false
  }

  async function startCamera() {
    error = null
    scanning = true
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoEl) {
        videoEl.srcObject = stream
        await videoEl.play()
        scanLoop()
      }
    } catch {
      error = i18n.t('sync.import.cameraError')
      scanning = false
    }
  }

  async function scanLoop() {
    if (!videoEl || !canvasEl) {
      animationHandle = requestAnimationFrame(scanLoop)
      return
    }

    const ctx = canvasEl.getContext('2d')
    if (!ctx || videoEl.readyState !== videoEl.HAVE_ENOUGH_DATA) {
      animationHandle = requestAnimationFrame(scanLoop)
      return
    }

    canvasEl.width = videoEl.videoWidth
    canvasEl.height = videoEl.videoHeight
    ctx.drawImage(videoEl, 0, 0)

    try {
      if ('BarcodeDetector' in window) {
        type BarcodeDetectorCtor = new (opts: { formats: string[] }) => {
          detect(img: HTMLCanvasElement): Promise<{ rawValue: string }[]>
        }
        const detector = new (
          window as unknown as { BarcodeDetector: BarcodeDetectorCtor }
        ).BarcodeDetector({ formats: ['qr_code'] })
        const barcodes = await detector.detect(canvasEl)
        if (barcodes.length > 0) {
          await handleQRData(barcodes[0]!.rawValue)
        }
      }
    } catch {
      // BarcodeDetector unavailable or transient error, keep scanning
    }

    if (!session.isComplete()) {
      animationHandle = requestAnimationFrame(scanLoop)
    }
  }

  async function handleQRData(data: string) {
    let chunk: DataChunk
    try {
      chunk = JSON.parse(data)
      if (
        typeof chunk.i !== 'number' ||
        typeof chunk.t !== 'number' ||
        typeof chunk.s !== 'string' ||
        typeof chunk.d !== 'string'
      ) {
        return
      }
    } catch {
      return
    }

    const result = session.addChunk(chunk)
    progress = { current: result.progress, total: result.total }

    if (result.error) {
      error = result.error
      return
    }

    if (result.complete) {
      stopCamera()
      await performImport()
    }
  }

  async function performImport() {
    importing = true
    error = null
    try {
      const result = await importFromQRData(session.getChunks())
      if (result.success) {
        complete = true
        recordCount = result.recordCount ?? 0
        oncomplete?.(recordCount)
      } else {
        error = result.error ?? i18n.t('sync.import.importError')
      }
    } catch (e) {
      error = e instanceof Error ? e.message : i18n.t('sync.import.importError')
    } finally {
      importing = false
    }
  }

  function close() {
    open = false
  }
</script>

<dialog bind:this={dialogEl} onclose={close}>
  <p class="dialog-title"><QrCode size={18} /> {i18n.t('sync.import.title')}</p>

  {#if complete}
    <div class="state-block">
      <div class="check-circle"><Check size={28} /></div>
      <p class="state-title">{i18n.t('sync.import.success')}</p>
      <p class="state-desc">
        {i18n.t('sync.import.recordsImported').replace('{count}', String(recordCount))}
      </p>
    </div>
    <div class="dialog-actions">
      <button type="button" class="btn-primary-sm" onclick={close}>{i18n.t('common.close')}</button>
    </div>
  {:else if importing}
    <div class="state-block">
      <Loader2 size={28} class="spin" />
      <p class="state-desc">{i18n.t('sync.import.importing')}</p>
    </div>
  {:else if scanning}
    <div class="camera-frame">
      <video bind:this={videoEl} playsinline muted></video>
      <div class="scan-box"></div>
      <canvas bind:this={canvasEl} class="hidden-canvas"></canvas>
    </div>

    {#if progress.total > 0}
      <div class="progress-block">
        <div class="progress-labels">
          <span>{i18n.t('sync.import.progress')}</span>
          <span>{progress.current} / {progress.total}</span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            style="width: {(progress.current / progress.total) * 100}%"
          ></div>
        </div>
      </div>
    {/if}

    {#if error}
      <div class="error-box"><AlertCircle size={16} />{error}</div>
    {/if}

    <div class="dialog-actions">
      <button type="button" class="btn-outline-sm" onclick={stopCamera}>
        <X size={16} />
        {i18n.t('common.cancel')}
      </button>
    </div>
  {:else}
    <div class="state-block">
      <div class="camera-icon"><Camera size={28} /></div>
      <p class="state-desc">{i18n.t('sync.import.scanInstructions')}</p>
    </div>

    {#if error}
      <div class="error-box"><AlertCircle size={16} />{error}</div>
    {/if}

    <div class="dialog-actions">
      <button type="button" class="btn-primary-sm" onclick={startCamera}>
        <Camera size={16} />
        {i18n.t('sync.import.startScan')}
      </button>
    </div>
    <button type="button" class="btn-outline-sm full" onclick={close}
      >{i18n.t('common.close')}</button
    >
    <p class="hint">{i18n.t('sync.import.cameraRequired')}</p>
  {/if}
</dialog>

<style>
  dialog {
    border: none;
    border-radius: 18px;
    padding: 18px;
    width: min(400px, calc(100vw - 48px));
    background: var(--bg);
    color: var(--ink);
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 45%);
  }
  .dialog-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    font-size: 15px;
    font-weight: 700;
    margin: 0 0 14px;
  }
  .state-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 0;
    text-align: center;
  }
  .state-block :global(.spin) {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .state-title {
    font-size: 15px;
    font-weight: 700;
    margin: 4px 0 0;
  }
  .state-desc {
    font-size: 13px;
    color: var(--ink-soft);
    margin: 0;
  }
  .check-circle {
    width: 56px;
    height: 56px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--ok) 18%, transparent);
    color: var(--ok);
  }
  .camera-icon {
    width: 56px;
    height: 56px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--page);
    color: var(--ink-soft);
  }
  .camera-frame {
    position: relative;
    aspect-ratio: 1;
    border-radius: 12px;
    overflow: hidden;
    background: #000;
    margin-bottom: 12px;
  }
  .camera-frame video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .scan-box {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 65%;
    height: 65%;
    border: 2px solid rgb(255 255 255 / 50%);
    border-radius: 12px;
  }
  .hidden-canvas {
    display: none;
  }
  .progress-block {
    margin-bottom: 12px;
  }
  .progress-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12.5px;
    margin-bottom: 6px;
  }
  .progress-bar {
    height: 6px;
    border-radius: 999px;
    background: var(--page);
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    transition: width 0.3s;
  }
  .error-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--alert) 14%, transparent);
    color: var(--alert);
    font-size: 12.5px;
    margin-bottom: 12px;
  }
  .btn-primary-sm {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px 12px;
    border-radius: 9px;
    border: none;
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
  }
  .btn-outline-sm {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px 12px;
    border-radius: 9px;
    border: 1px solid var(--line);
    background: var(--page);
    color: var(--ink);
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
  }
  .btn-outline-sm.full {
    width: 100%;
    margin-top: 8px;
  }
  .dialog-actions {
    display: flex;
    gap: 10px;
  }
  .dialog-actions .btn-primary-sm,
  .dialog-actions .btn-outline-sm {
    flex: 1;
  }
  .hint {
    font-size: 11.5px;
    color: var(--ink-soft);
    text-align: center;
    margin: 10px 0 0;
  }
</style>
