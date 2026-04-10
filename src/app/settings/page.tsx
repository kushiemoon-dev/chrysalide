'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  Upload,
  Trash2,
  Info,
  Bell,
  Calendar,
  ChevronRight,
  Palette,
  TrendingUp,
  Coins,
  Pill,
  QrCode,
  Smartphone,
  Globe,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { exportAllData, importAllData, getUpcomingAppointments } from '@/lib/db'
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getNotificationPreferences,
  setNotificationPreferences,
  getModulePreferences,
  setModulePreferences,
} from '@/lib/notifications'
import { startReminderService } from '@/lib/notification-scheduler'
import { QRExport } from '@/components/sync/qr-export'
import { QRImport } from '@/components/sync/qr-import'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ThemePicker } from '@/components/settings/theme-picker'
import { useLocaleSwitch } from '@/i18n/use-locale-switch'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  const { locale, setLocale } = useLocaleSwitch()
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<string>('default')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [appointmentCount, setAppointmentCount] = useState(0)
  const [evolutionEnabled, setEvolutionEnabled] = useState(true)
  const [costTrackingEnabled, setCostTrackingEnabled] = useState(false)
  const [autoValidationEnabled, setAutoValidationEnabled] = useState(false)
  const [showQRExport, setShowQRExport] = useState(false)
  const [showQRImport, setShowQRImport] = useState(false)

  useEffect(() => {
    // Load notification status
    if (isNotificationSupported()) {
      setNotificationPermission(getNotificationPermission())
      setNotificationsEnabled(getNotificationPreferences().notificationsEnabled)
    }
    // Load module preferences
    const modulePrefs = getModulePreferences()
    setEvolutionEnabled(modulePrefs.evolutionEnabled)
    setCostTrackingEnabled(modulePrefs.costTrackingEnabled)
    // Load auto-validation setting
    const autoValidation = localStorage.getItem('medication-auto-validation') === 'true'
    setAutoValidationEnabled(autoValidation)
    // Load appointment count
    getUpcomingAppointments().then((appts) => setAppointmentCount(appts.length))
  }, [])

  function handleEvolutionToggle(enabled: boolean) {
    setEvolutionEnabled(enabled)
    setModulePreferences({ evolutionEnabled: enabled })
    // Dispatch custom event for same-tab updates (bottom-nav listens to this)
    window.dispatchEvent(new Event('modulePrefsChanged'))
  }

  function handleCostTrackingToggle(enabled: boolean) {
    setCostTrackingEnabled(enabled)
    setModulePreferences({ costTrackingEnabled: enabled })
    window.dispatchEvent(new Event('modulePrefsChanged'))
  }

  function handleAutoValidationToggle(enabled: boolean) {
    setAutoValidationEnabled(enabled)
    localStorage.setItem('medication-auto-validation', enabled.toString())
  }

  async function handleEnableNotifications() {
    const permission = await requestNotificationPermission()
    setNotificationPermission(permission)
    if (permission === 'granted') {
      setNotificationsEnabled(true)
      setNotificationPreferences({ notificationsEnabled: true })
      // Start reminder service and notify other components
      startReminderService()
      window.dispatchEvent(
        new CustomEvent('notificationPrefsChanged', { detail: { enabled: true } })
      )
    }
  }

  function handleDisableNotifications() {
    setNotificationsEnabled(false)
    setNotificationPreferences({ notificationsEnabled: false })
    // Notify other components to stop reminder service
    window.dispatchEvent(
      new CustomEvent('notificationPrefsChanged', { detail: { enabled: false } })
    )
  }

  async function handleExport() {
    setExporting(true)
    try {
      const data = await exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chrysalide-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExporting(false)
    }
  }

  async function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setImporting(true)
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        await importAllData(data)
        window.location.reload()
      } catch (error) {
        console.error('Import error:', error)
        alert(t('importError'))
      } finally {
        setImporting(false)
      }
    }
    input.click()
  }

  return (
    <div className="space-y-6 p-4">
      <div className="pt-2">
        <h1 className="text-foreground text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </div>

      {/* Theme Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="text-primary h-5 w-5" />
          <h2 className="text-foreground text-lg font-semibold">{t('appearance')}</h2>
        </div>
        <ThemePicker />
      </div>

      {/* Language Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            {t('language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={locale} onValueChange={setLocale}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('backup.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">{t('backup.description')}</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download className="h-4 w-4" />
              {exporting ? tc('exporting') : tc('export')}
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleImport}
              disabled={importing}
            >
              <Upload className="h-4 w-4" />
              {importing ? tc('importing') : tc('import')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4" />
            {t('qrSync.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">{t('qrSync.description')}</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => setShowQRExport(true)}
            >
              <QrCode className="h-4 w-4" />
              {tc('export')}
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => setShowQRImport(true)}
            >
              <QrCode className="h-4 w-4" />
              {tc('import')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Export Modal */}
      {showQRExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <QRExport onClose={() => setShowQRExport(false)} />
        </div>
      )}

      {/* QR Import Modal */}
      {showQRImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <QRImport
            onClose={() => setShowQRImport(false)}
            onComplete={() => {
              setShowQRImport(false)
              window.location.reload()
            }}
          />
        </div>
      )}

      {/* Appointments Link */}
      <Link href="/appointments">
        <Card className="hover:bg-muted/30 cursor-pointer transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <Calendar className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground font-medium">{t('appointments.title')}</p>
                  <p className="text-muted-foreground text-sm">
                    {appointmentCount > 0
                      ? t('appointments.upcoming', { count: appointmentCount })
                      : t('appointments.manage')}
                  </p>
                </div>
              </div>
              <ChevronRight className="text-muted-foreground h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            {t('notifications.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isNotificationSupported() ? (
            <p className="text-muted-foreground text-sm">{t('notifications.notSupported')}</p>
          ) : notificationPermission === 'denied' ? (
            <div className="space-y-2">
              <Badge variant="destructive">{t('notifications.blocked')}</Badge>
              <p className="text-muted-foreground text-sm">
                {t('notifications.blockedDescription')}
              </p>
            </div>
          ) : notificationsEnabled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600">
                  {t('notifications.enabled')}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {t('notifications.enabledDescription')}
              </p>
              <Button variant="outline" size="sm" onClick={handleDisableNotifications}>
                {t('notifications.disable')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                {t('notifications.enableDescription')}
              </p>
              <Button onClick={handleEnableNotifications} className="gap-2">
                <Bell className="h-4 w-4" />
                {t('notifications.enable')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Pill className="h-4 w-4" />
            {t('medications.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-foreground font-medium">{t('medications.autoValidation')}</p>
              <p className="text-muted-foreground text-sm">
                {t('medications.autoValidationDescription')}
              </p>
            </div>
            <Switch checked={autoValidationEnabled} onCheckedChange={handleAutoValidationToggle} />
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('modules.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <TrendingUp className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-foreground font-medium">{t('modules.evolution')}</p>
                <p className="text-muted-foreground text-sm">{t('modules.evolutionDescription')}</p>
              </div>
            </div>
            <Switch checked={evolutionEnabled} onCheckedChange={handleEvolutionToggle} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <Coins className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-foreground font-medium">{t('modules.costTracking')}</p>
                <p className="text-muted-foreground text-sm">
                  {t('modules.costTrackingDescription')}
                </p>
              </div>
            </div>
            <Switch checked={costTrackingEnabled} onCheckedChange={handleCostTrackingToggle} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="text-primary h-4 w-4" />
            {t('about.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">{tc('version')}:</span>{' '}
              <span className="text-foreground">1.1.0</span>
            </p>
            <p className="text-muted-foreground">{t('about.description')}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2 text-base">
            <Trash2 className="h-4 w-4" />
            {t('dangerZone.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-3 text-sm">{t('dangerZone.description')}</p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm(t('dangerZone.confirmDelete'))) {
                indexedDB.deleteDatabase('ChrysalideDB')
                window.location.reload()
              }
            }}
          >
            {t('dangerZone.deleteAll')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
