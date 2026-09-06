<script lang="ts">
  import { i18n, locales, type Locale } from '$lib/i18n.svelte'
  import { theme } from '$lib/theme.svelte'
  import { exportAllData, importAllData, getUpcomingAppointments } from '$lib/db'
  import {
    isNotificationSupported,
    getNotificationPermission,
    requestNotificationPermission,
    getNotificationPreferences,
    setNotificationPreferences,
    getModulePreferences,
    setModulePreferences,
    isAutoValidationEnabled,
    type NotificationPermission,
  } from '$lib/notifications'
  import { startReminderService, stopReminderService } from '$lib/notification-scheduler'
  import QRExportDialog from '$lib/components/settings/QRExportDialog.svelte'
  import QRImportDialog from '$lib/components/settings/QRImportDialog.svelte'
  import Moon from '@lucide/svelte/icons/moon'
  import Sun from '@lucide/svelte/icons/sun'
  import Monitor from '@lucide/svelte/icons/monitor'
  import Globe from '@lucide/svelte/icons/globe'
  import Download from '@lucide/svelte/icons/download'
  import Upload from '@lucide/svelte/icons/upload'
  import Calendar from '@lucide/svelte/icons/calendar'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import Bell from '@lucide/svelte/icons/bell'
  import Pill from '@lucide/svelte/icons/pill'
  import TrendingUp from '@lucide/svelte/icons/trending-up'
  import Coins from '@lucide/svelte/icons/coins'
  import Info from '@lucide/svelte/icons/info'
  import Trash2 from '@lucide/svelte/icons/trash-2'
  import Smartphone from '@lucide/svelte/icons/smartphone'
  import QrCode from '@lucide/svelte/icons/qr-code'

  const MODE_ICONS = { light: Sun, dark: Moon, system: Monitor } as const

  let exporting = $state(false)
  let importing = $state(false)
  let notificationPermission = $state<NotificationPermission>('default')
  let notificationsEnabled = $state(false)
  let appointmentCount = $state(0)
  let evolutionEnabled = $state(true)
  let costTrackingEnabled = $state(false)
  let autoValidationEnabled = $state(false)
  let importError = $state(false)
  let fileInput = $state<HTMLInputElement>()
  let showQRExport = $state(false)
  let showQRImport = $state(false)

  $effect(() => {
    if (isNotificationSupported()) {
      notificationPermission = getNotificationPermission()
      notificationsEnabled = getNotificationPreferences().notificationsEnabled
    }
    const modulePrefs = getModulePreferences()
    evolutionEnabled = modulePrefs.evolutionEnabled
    costTrackingEnabled = modulePrefs.costTrackingEnabled
    autoValidationEnabled = isAutoValidationEnabled()
    getUpcomingAppointments().then((appts) => (appointmentCount = appts.length))
  })

  function handleEvolutionToggle(enabled: boolean) {
    evolutionEnabled = enabled
    setModulePreferences({ evolutionEnabled: enabled })
    window.dispatchEvent(new Event('modulePrefsChanged'))
  }

  function handleCostTrackingToggle(enabled: boolean) {
    costTrackingEnabled = enabled
    setModulePreferences({ costTrackingEnabled: enabled })
    window.dispatchEvent(new Event('modulePrefsChanged'))
  }

  function handleAutoValidationToggle(enabled: boolean) {
    autoValidationEnabled = enabled
    localStorage.setItem('medication-auto-validation', String(enabled))
  }

  async function handleEnableNotifications() {
    const permission = await requestNotificationPermission()
    notificationPermission = permission
    if (permission === 'granted') {
      notificationsEnabled = true
      setNotificationPreferences({ notificationsEnabled: true })
      startReminderService()
    }
  }

  function handleDisableNotifications() {
    notificationsEnabled = false
    setNotificationPreferences({ notificationsEnabled: false })
    stopReminderService()
  }

  async function handleExport() {
    exporting = true
    try {
      const data = await exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chrysalide-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      exporting = false
    }
  }

  function triggerImport() {
    fileInput?.click()
  }

  async function handleImportFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    importing = true
    importError = false
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importAllData(data)
      window.location.reload()
    } catch {
      importError = true
    } finally {
      importing = false
    }
  }

  function handleDeleteAll() {
    if (!confirm(i18n.t('settings.dangerZone.confirmDelete'))) return
    indexedDB.deleteDatabase('ChrysalideDB')
    window.location.reload()
  }
</script>

<div class="header">
  <h1>{i18n.t('settings.title')}</h1>
  <p class="subtitle">{i18n.t('settings.subtitle')}</p>
</div>

<div class="section">
  <h2>{i18n.t('settings.appearance')}</h2>
  <div class="card mode-row">
    {#each Object.entries(MODE_ICONS) as [mode, Icon] (mode)}
      <button
        type="button"
        class="mode-btn"
        class:active={theme.config.mode === mode}
        onclick={() => theme.setMode(mode as 'light' | 'dark' | 'system')}
      >
        <Icon size={16} />
        {i18n.t(`theme.modes.${mode}.label`)}
      </button>
    {/each}
  </div>
  <div class="card row-line">
    <div>
      <p class="row-title">{i18n.t('theme.reducedMotion')}</p>
      <p class="row-desc">{i18n.t('theme.reducedMotionDescription')}</p>
    </div>
    <label class="switch">
      <input
        type="checkbox"
        checked={theme.config.reducedMotion}
        onchange={(e) => theme.setReducedMotion(e.currentTarget.checked)}
      />
      <span class="switch-track"></span>
    </label>
  </div>
</div>

<div class="section">
  <h2><Globe size={16} />{i18n.t('settings.language')}</h2>
  <div class="card">
    <select value={i18n.locale} onchange={(e) => i18n.setLocale(e.currentTarget.value as Locale)}>
      {#each locales as locale (locale)}
        <option value={locale}
          >{locale === 'fr' ? 'Français' : locale === 'en' ? 'English' : 'Deutsch'}</option
        >
      {/each}
    </select>
  </div>
</div>

<div class="section">
  <h2>{i18n.t('settings.backup.title')}</h2>
  <div class="card">
    <p class="row-desc">{i18n.t('settings.backup.description')}</p>
    <div class="btn-row">
      <button type="button" class="btn-outline" onclick={handleExport} disabled={exporting}>
        <Download size={16} />
        {exporting ? i18n.t('common.exporting') : i18n.t('common.export')}
      </button>
      <button type="button" class="btn-outline" onclick={triggerImport} disabled={importing}>
        <Upload size={16} />
        {importing ? i18n.t('common.importing') : i18n.t('common.import')}
      </button>
      <input
        bind:this={fileInput}
        type="file"
        accept=".json"
        class="sr-only"
        onchange={handleImportFile}
      />
    </div>
    {#if importError}
      <p class="error-text">{i18n.t('settings.importError')}</p>
    {/if}
  </div>
</div>

<div class="section">
  <h2><Smartphone size={16} />{i18n.t('settings.qrSync.title')}</h2>
  <div class="card">
    <p class="row-desc">{i18n.t('settings.qrSync.description')}</p>
    <div class="btn-row">
      <button type="button" class="btn-outline" onclick={() => (showQRExport = true)}>
        <QrCode size={16} />
        {i18n.t('common.export')}
      </button>
      <button type="button" class="btn-outline" onclick={() => (showQRImport = true)}>
        <QrCode size={16} />
        {i18n.t('common.import')}
      </button>
    </div>
  </div>
</div>

<QRExportDialog bind:open={showQRExport} />
<QRImportDialog
  bind:open={showQRImport}
  oncomplete={() => {
    showQRImport = false
    window.location.reload()
  }}
/>

<a href="/appointments" class="card link-card">
  <div class="link-icon"><Calendar size={18} /></div>
  <div class="link-body">
    <p class="row-title">{i18n.t('settings.appointments.title')}</p>
    <p class="row-desc">
      {appointmentCount > 0
        ? i18n.t('settings.appointments.upcoming').replace('{count}', String(appointmentCount))
        : i18n.t('settings.appointments.manage')}
    </p>
  </div>
  <ChevronRight size={18} class="chevron" />
</a>

<div class="section">
  <h2><Bell size={16} />{i18n.t('settings.notifications.title')}</h2>
  <div class="card">
    {#if !isNotificationSupported()}
      <p class="row-desc">{i18n.t('settings.notifications.notSupported')}</p>
    {:else if notificationPermission === 'denied'}
      <p class="badge alert">{i18n.t('settings.notifications.blocked')}</p>
      <p class="row-desc">{i18n.t('settings.notifications.blockedDescription')}</p>
    {:else if notificationsEnabled}
      <p class="badge ok">{i18n.t('settings.notifications.enabled')}</p>
      <p class="row-desc">{i18n.t('settings.notifications.enabledDescription')}</p>
      <button type="button" class="btn-outline" onclick={handleDisableNotifications}>
        {i18n.t('settings.notifications.disable')}
      </button>
    {:else}
      <p class="row-desc">{i18n.t('settings.notifications.enableDescription')}</p>
      <button type="button" class="btn-primary-sm" onclick={handleEnableNotifications}>
        <Bell size={16} />
        {i18n.t('settings.notifications.enable')}
      </button>
    {/if}
  </div>
</div>

<div class="section">
  <h2><Pill size={16} />{i18n.t('settings.medications.title')}</h2>
  <div class="card row-line">
    <div>
      <p class="row-title">{i18n.t('settings.medications.autoValidation')}</p>
      <p class="row-desc">{i18n.t('settings.medications.autoValidationDescription')}</p>
    </div>
    <label class="switch">
      <input
        type="checkbox"
        checked={autoValidationEnabled}
        onchange={(e) => handleAutoValidationToggle(e.currentTarget.checked)}
      />
      <span class="switch-track"></span>
    </label>
  </div>
</div>

<div class="section">
  <h2>{i18n.t('settings.modules.title')}</h2>
  <div class="card row-line">
    <div class="row-with-icon">
      <TrendingUp size={16} />
      <div>
        <p class="row-title">{i18n.t('settings.modules.evolution')}</p>
        <p class="row-desc">{i18n.t('settings.modules.evolutionDescription')}</p>
      </div>
    </div>
    <label class="switch">
      <input
        type="checkbox"
        checked={evolutionEnabled}
        onchange={(e) => handleEvolutionToggle(e.currentTarget.checked)}
      />
      <span class="switch-track"></span>
    </label>
  </div>
  <div class="card row-line">
    <div class="row-with-icon">
      <Coins size={16} />
      <div>
        <p class="row-title">{i18n.t('settings.modules.costTracking')}</p>
        <p class="row-desc">{i18n.t('settings.modules.costTrackingDescription')}</p>
      </div>
    </div>
    <label class="switch">
      <input
        type="checkbox"
        checked={costTrackingEnabled}
        onchange={(e) => handleCostTrackingToggle(e.currentTarget.checked)}
      />
      <span class="switch-track"></span>
    </label>
  </div>
</div>

<div class="section">
  <h2><Info size={16} />{i18n.t('settings.about.title')}</h2>
  <div class="card">
    <p class="row-desc"><span class="row-title">{i18n.t('common.version')}:</span> 2.0.0</p>
    <p class="row-desc">{i18n.t('settings.about.description')}</p>
  </div>
</div>

<div class="section">
  <h2 class="danger"><Trash2 size={16} />{i18n.t('settings.dangerZone.title')}</h2>
  <div class="card">
    <p class="row-desc">{i18n.t('settings.dangerZone.description')}</p>
    <button type="button" class="btn-danger" onclick={handleDeleteAll}>
      {i18n.t('settings.dangerZone.deleteAll')}
    </button>
  </div>
</div>

<style>
  .header {
    margin-bottom: 18px;
  }
  h1 {
    font-size: 21px;
    font-weight: 700;
    margin: 0;
  }
  .subtitle {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .section {
    margin-bottom: 18px;
  }
  .section h2 {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 700;
    margin: 0 0 8px;
  }
  .section h2.danger {
    color: var(--alert);
  }
  .card {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 14px;
    margin-bottom: 10px;
  }
  .card select {
    width: 100%;
    padding: 8px 4px;
    border: none;
    background: transparent;
    color: var(--ink);
    font-family: inherit;
    font-size: 13.5px;
  }
  .mode-row {
    display: flex;
    gap: 6px;
    padding: 6px;
  }
  .mode-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 6px;
    border-radius: 12px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--ink-soft);
    font-family: inherit;
    font-size: 11.5px;
    font-weight: 600;
    cursor: pointer;
  }
  .mode-btn.active {
    background: color-mix(in srgb, var(--blue-deep) 14%, transparent);
    border-color: color-mix(in srgb, var(--blue-deep) 30%, transparent);
    color: var(--ink);
  }
  .row-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .row-with-icon {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .row-title {
    font-size: 13.5px;
    font-weight: 600;
    margin: 0;
  }
  .row-desc {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 24px;
    flex-shrink: 0;
  }
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .switch-track {
    position: absolute;
    inset: 0;
    background: var(--line);
    border-radius: 999px;
    transition: background 0.2s ease;
  }
  .switch-track::before {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    left: 3px;
    top: 3px;
    background: var(--bg);
    border-radius: 50%;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 2px var(--shadow);
  }
  .switch input:checked + .switch-track {
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
  }
  .switch input:checked + .switch-track::before {
    transform: translateX(16px);
  }
  .btn-row {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  .btn-outline {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: transparent;
    color: var(--ink);
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-primary-sm {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    border: none;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-danger {
    padding: 9px 14px;
    border-radius: 10px;
    background: var(--alert);
    color: #fff;
    border: none;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .error-text {
    font-size: 12px;
    color: var(--alert);
    margin: 8px 0 0;
  }
  .badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 999px;
    margin: 0 0 6px;
  }
  .badge.ok {
    background: color-mix(in srgb, var(--ok) 20%, transparent);
    color: var(--ok);
  }
  .badge.alert {
    background: color-mix(in srgb, var(--alert) 20%, transparent);
    color: var(--alert);
  }
  .link-card {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: inherit;
    margin-bottom: 18px;
  }
  .link-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--blue-deep) 14%, transparent);
    color: var(--blue-deep);
    flex-shrink: 0;
  }
  .link-body {
    flex: 1;
    min-width: 0;
  }
  .link-card :global(.chevron) {
    color: var(--ink-soft);
    flex-shrink: 0;
  }
</style>
