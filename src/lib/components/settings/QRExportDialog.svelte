<script lang="ts">
  import QRCode from 'qrcode'
  import { generateExportQRData, type DataChunk } from '$lib/qr-sync'
  import { i18n } from '$lib/i18n.svelte'
  import QrCode from '@lucide/svelte/icons/qr-code'
  import ChevronLeft from '@lucide/svelte/icons/chevron-left'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import Check from '@lucide/svelte/icons/check'
  import Loader2 from '@lucide/svelte/icons/loader-2'

  let { open = $bindable(false) }: { open?: boolean } = $props()

  let dialogEl = $state<HTMLDialogElement>()
  let loading = $state(true)
  let chunks = $state<DataChunk[]>([])
  let currentIndex = $state(0)
  let error = $state<string | null>(null)
  let qrDataUrl = $state<string | null>(null)

  $effect(() => {
    if (!dialogEl) return
    if (open) dialogEl.showModal()
    else dialogEl.close()
  })

  $effect(() => {
    if (open) generateQRCodes()
  })

  $effect(() => {
    const chunk = chunks[currentIndex]
    if (!chunk) {
      qrDataUrl = null
      return
    }
    QRCode.toDataURL(JSON.stringify(chunk), { width: 256, margin: 2 }).then((url) => {
      qrDataUrl = url
    })
  })

  async function generateQRCodes() {
    loading = true
    error = null
    try {
      const { chunks: exportChunks } = await generateExportQRData()
      chunks = exportChunks
      currentIndex = 0
    } catch (e) {
      error = e instanceof Error ? e.message : i18n.t('sync.export.generationError')
    } finally {
      loading = false
    }
  }

  function close() {
    open = false
  }
</script>

<dialog bind:this={dialogEl} onclose={close}>
  <p class="dialog-title"><QrCode size={18} /> {i18n.t('sync.export.title')}</p>

  {#if loading}
    <div class="state-block">
      <Loader2 size={28} class="spin" />
      <p>{i18n.t('sync.export.generating')}</p>
    </div>
  {:else if error}
    <div class="state-block">
      <p class="error">{error}</p>
      <button type="button" class="btn-outline-sm" onclick={generateQRCodes}>
        {i18n.t('sync.export.retry')}
      </button>
    </div>
  {:else}
    <div class="qr-frame">
      {#if qrDataUrl}
        <img src={qrDataUrl} alt="" width="256" height="256" />
      {/if}
    </div>

    {#if chunks.length > 1}
      <div class="nav-row">
        <button
          type="button"
          class="icon-btn"
          onclick={() => (currentIndex = Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          aria-label={i18n.t('common.back')}
        >
          <ChevronLeft size={16} />
        </button>
        <span class="nav-count">
          {currentIndex + 1} / {chunks.length}
          {#if currentIndex === chunks.length - 1}<Check size={14} class="ok" />{/if}
        </span>
        <button
          type="button"
          class="icon-btn"
          onclick={() => (currentIndex = Math.min(chunks.length - 1, currentIndex + 1))}
          disabled={currentIndex === chunks.length - 1}
          aria-label="next"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div class="dots">
        {#each chunks as _, i (i)}
          <button
            type="button"
            class="dot"
            class:active={i === currentIndex}
            class:done={i < currentIndex}
            onclick={() => (currentIndex = i)}
            aria-label={String(i + 1)}
          ></button>
        {/each}
      </div>
    {/if}

    <p class="hint">
      {chunks.length > 1 ? i18n.t('sync.export.scanInOrder') : i18n.t('sync.export.scanSingle')}
    </p>
    {#if chunks.length > 1}
      <p class="session-hint">
        {i18n.t('sync.export.session')}: <code>{chunks[currentIndex]?.s}</code>
      </p>
    {/if}
  {/if}

  <div class="dialog-actions">
    <button type="button" class="btn-outline-sm" onclick={close}>{i18n.t('common.close')}</button>
  </div>
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
    gap: 10px;
    padding: 30px 0;
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
  .state-block p {
    font-size: 13px;
    color: var(--ink-soft);
    margin: 0;
  }
  .error {
    color: var(--alert) !important;
  }
  .qr-frame {
    display: flex;
    justify-content: center;
    padding: 14px;
    background: #fff;
    border-radius: 12px;
    margin-bottom: 14px;
  }
  .qr-frame img {
    display: block;
    width: 220px;
    height: 220px;
  }
  .nav-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    border: 1px solid var(--line);
    background: var(--page);
    color: var(--ink);
    cursor: pointer;
  }
  .icon-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .nav-count {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    font-weight: 600;
  }
  .nav-count :global(.ok) {
    color: var(--ok);
  }
  .dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-bottom: 14px;
  }
  .dot {
    width: 8px;
    height: 8px;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: var(--line);
    cursor: pointer;
  }
  .dot.active {
    background: var(--blue-deep);
  }
  .dot.done {
    background: var(--ok);
  }
  .hint {
    font-size: 12.5px;
    color: var(--ink-soft);
    text-align: center;
    margin: 0 0 4px;
  }
  .session-hint {
    font-size: 11.5px;
    color: var(--ink-soft);
    text-align: center;
    margin: 0 0 14px;
  }
  .session-hint code {
    background: var(--page);
    border-radius: 5px;
    padding: 1px 6px;
  }
  .btn-outline-sm {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 9px 12px;
    border-radius: 9px;
    border: 1px solid var(--line);
    background: var(--page);
    color: var(--ink);
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
  }
  .dialog-actions {
    display: flex;
    gap: 10px;
    margin-top: 4px;
  }
  .dialog-actions .btn-outline-sm {
    flex: 1;
  }
</style>
