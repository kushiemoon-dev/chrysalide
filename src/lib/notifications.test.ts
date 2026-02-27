import { describe, it, expect, beforeEach } from 'vitest'
import {
  isPeriodicFrequency,
  getFrequencyIntervalDays,
  parseFrequencyToHours,
  getMedicationReminderTimes,
  shouldTakeMedicationOnDate,
  getNotificationPreferences,
  setNotificationPreferences,
  getModulePreferences,
  setModulePreferences,
  isAutoValidationEnabled,
  isScheduledTimePassed,
  REMINDER_MESSAGES,
} from './notifications'

beforeEach(() => {
  localStorage.clear()
})

describe('isPeriodicFrequency', () => {
  it('retourne false pour les fréquences quotidiennes', () => {
    expect(isPeriodicFrequency('1x/jour')).toBe(false)
    expect(isPeriodicFrequency('2x/jour')).toBe(false)
    expect(isPeriodicFrequency('3x/jour')).toBe(false)
  })

  it('retourne true pour les fréquences hebdomadaires', () => {
    expect(isPeriodicFrequency('1x/semaine')).toBe(true)
    expect(isPeriodicFrequency('2x/semaine')).toBe(true)
    expect(isPeriodicFrequency('1x/2semaines')).toBe(true)
  })

  it('retourne true pour les fréquences mensuelles', () => {
    expect(isPeriodicFrequency('1x/mois')).toBe(true)
    expect(isPeriodicFrequency('1x/3mois')).toBe(true) // contient "mois"
    expect(isPeriodicFrequency('1x/6mois')).toBe(true)
    expect(isPeriodicFrequency('mensuel')).toBe(false) // "mensuel" ne contient pas "mois"
  })

  it('retourne true pour les fréquences plurijours', () => {
    expect(isPeriodicFrequency('1x/2jours')).toBe(true)
    expect(isPeriodicFrequency('1x/3jours')).toBe(true)
    expect(isPeriodicFrequency('1x/10jours')).toBe(true)
  })
})

describe('getFrequencyIntervalDays', () => {
  it('retourne 1 pour quotidien par défaut', () => {
    expect(getFrequencyIntervalDays('1x/jour')).toBe(1)
    expect(getFrequencyIntervalDays('quotidien')).toBe(1)
  })

  it('retourne les intervalles plurijours corrects', () => {
    expect(getFrequencyIntervalDays('1x/2jours')).toBe(2)
    expect(getFrequencyIntervalDays('1x/3jours')).toBe(3)
    expect(getFrequencyIntervalDays('1x/5jours')).toBe(5)
    expect(getFrequencyIntervalDays('1x/10jours')).toBe(10)
  })

  it('retourne les intervalles hebdomadaires corrects', () => {
    expect(getFrequencyIntervalDays('1x/semaine')).toBe(7)
    expect(getFrequencyIntervalDays('1x/2semaines')).toBe(14)
    expect(getFrequencyIntervalDays('2x/semaine')).toBe(3.5)
  })

  it('retourne les intervalles mensuels corrects', () => {
    expect(getFrequencyIntervalDays('1x/mois')).toBe(28)
    expect(getFrequencyIntervalDays('1x/3mois')).toBe(84)
    expect(getFrequencyIntervalDays('1x/6mois')).toBe(168)
  })
})

describe('parseFrequencyToHours', () => {
  it('retourne [9] pour 1x/jour', () => {
    expect(parseFrequencyToHours('1x/jour')).toEqual([9])
    expect(parseFrequencyToHours('quotidien')).toEqual([9])
    expect(parseFrequencyToHours('tous les jours')).toEqual([9])
  })

  it('retourne [9, 21] pour 2x/jour', () => {
    expect(parseFrequencyToHours('2x/jour')).toEqual([9, 21])
    expect(parseFrequencyToHours('2 fois')).toEqual([9, 21])
  })

  it('retourne [8, 14, 20] pour 3x/jour', () => {
    expect(parseFrequencyToHours('3x/jour')).toEqual([8, 14, 20])
    expect(parseFrequencyToHours('3 fois')).toEqual([8, 14, 20])
  })

  it('retourne null pour les fréquences périodiques', () => {
    expect(parseFrequencyToHours('1x/semaine')).toBeNull()
    expect(parseFrequencyToHours('1x/mois')).toBeNull()
    expect(parseFrequencyToHours('1x/2jours')).toBeNull()
  })

  it('retourne [9] par défaut pour fréquence inconnue quotidienne', () => {
    expect(parseFrequencyToHours('inconnu')).toEqual([9])
  })
})

describe('getMedicationReminderTimes', () => {
  it('utilise les horaires explicites en mode avancé', () => {
    const med = {
      schedulingMode: 'advanced' as const,
      scheduledTimes: ['08:00', '20:00'],
      frequency: '2x/jour',
    }
    expect(getMedicationReminderTimes(med)).toEqual(['08:00', '20:00'])
  })

  it('parse la fréquence en mode simple', () => {
    expect(getMedicationReminderTimes({ frequency: '2x/jour' })).toEqual(['09:00', '21:00'])
    expect(getMedicationReminderTimes({ frequency: '3x/jour' })).toEqual([
      '08:00',
      '14:00',
      '20:00',
    ])
  })

  it('retourne ["09:00"] pour les fréquences périodiques sans horaire explicite', () => {
    expect(getMedicationReminderTimes({ frequency: '1x/semaine' })).toEqual(['09:00'])
    expect(getMedicationReminderTimes({ frequency: '1x/mois' })).toEqual(['09:00'])
  })

  it('ignore scheduledTimes vide en mode avancé', () => {
    const med = { schedulingMode: 'advanced' as const, scheduledTimes: [], frequency: '1x/jour' }
    expect(getMedicationReminderTimes(med)).toEqual(['09:00'])
  })
})

describe('shouldTakeMedicationOnDate', () => {
  const startDate = new Date('2024-01-01')

  it('retourne true le jour de début', () => {
    const med = { frequency: '1x/jour', startDate }
    expect(shouldTakeMedicationOnDate(med, new Date('2024-01-01'))).toBe(true)
  })

  it('retourne false avant le début', () => {
    const med = { frequency: '1x/jour', startDate }
    expect(shouldTakeMedicationOnDate(med, new Date('2023-12-31'))).toBe(false)
  })

  it('retourne true tous les jours pour 1x/jour', () => {
    const med = { frequency: '1x/jour', startDate }
    expect(shouldTakeMedicationOnDate(med, new Date('2024-01-15'))).toBe(true)
    expect(shouldTakeMedicationOnDate(med, new Date('2024-06-01'))).toBe(true)
  })

  it('retourne true tous les 7 jours pour 1x/semaine', () => {
    const med = { frequency: '1x/semaine', startDate }
    expect(shouldTakeMedicationOnDate(med, new Date('2024-01-01'))).toBe(true) // jour 0
    expect(shouldTakeMedicationOnDate(med, new Date('2024-01-08'))).toBe(true) // jour 7
    expect(shouldTakeMedicationOnDate(med, new Date('2024-01-02'))).toBe(false) // jour 1
  })

  it('retourne false après la date de fin', () => {
    const med = { frequency: '1x/jour', startDate, endDate: new Date('2024-01-10') }
    expect(shouldTakeMedicationOnDate(med, new Date('2024-01-10'))).toBe(true)
    expect(shouldTakeMedicationOnDate(med, new Date('2024-01-11'))).toBe(false)
  })
})

describe('REMINDER_MESSAGES', () => {
  it('medication body inclut le nom', () => {
    expect(REMINDER_MESSAGES.medication.body('Estradiol')).toContain('Estradiol')
  })

  it('refill body inclut le nom', () => {
    expect(REMINDER_MESSAGES.refill.body('Estradiol')).toContain('Estradiol')
  })

  it('appointment body inclut les détails', () => {
    expect(REMINDER_MESSAGES.appointment.body('Dr. Martin demain')).toContain('Dr. Martin demain')
  })
})

describe('getNotificationPreferences / setNotificationPreferences', () => {
  it('retourne les valeurs par défaut quand localStorage est vide', () => {
    const prefs = getNotificationPreferences()
    expect(prefs.notificationsEnabled).toBe(false)
    expect(prefs.medicationReminders).toBe(true)
    expect(prefs.appointmentReminders).toBe(true)
    expect(prefs.stockAlerts).toBe(true)
  })

  it('retourne les valeurs sauvegardées', () => {
    setNotificationPreferences({ notificationsEnabled: true, medicationReminders: false })
    const prefs = getNotificationPreferences()
    expect(prefs.notificationsEnabled).toBe(true)
    expect(prefs.medicationReminders).toBe(false)
    expect(prefs.appointmentReminders).toBe(true) // non modifié
  })

  it('ne modifie que les clés fournies (partial update)', () => {
    setNotificationPreferences({ stockAlerts: false })
    const prefs = getNotificationPreferences()
    expect(prefs.stockAlerts).toBe(false)
    expect(prefs.medicationReminders).toBe(true) // inchangé
  })
})

describe('isAutoValidationEnabled', () => {
  it('retourne false par défaut', () => {
    expect(isAutoValidationEnabled()).toBe(false)
  })

  it('retourne true si activé dans localStorage', () => {
    localStorage.setItem('medication-auto-validation', 'true')
    expect(isAutoValidationEnabled()).toBe(true)
  })
})

describe('isScheduledTimePassed', () => {
  it('retourne true pour 00:01 (toujours passé)', () => {
    expect(isScheduledTimePassed('00:01')).toBe(true)
  })

  it('retourne false pour 23:59 (pas encore passé sauf en fin de journée)', () => {
    const now = new Date()
    // Seulement faux si on n'est pas encore à 23:59
    if (now.getHours() < 23 || (now.getHours() === 23 && now.getMinutes() < 59)) {
      expect(isScheduledTimePassed('23:59')).toBe(false)
    }
  })
})

describe('getModulePreferences / setModulePreferences', () => {
  it('evolution activé par défaut', () => {
    expect(getModulePreferences().evolutionEnabled).toBe(true)
  })

  it('costTracking désactivé par défaut', () => {
    expect(getModulePreferences().costTrackingEnabled).toBe(false)
  })

  it('sauvegarde et relit les préférences', () => {
    setModulePreferences({ evolutionEnabled: false, costTrackingEnabled: true })
    const prefs = getModulePreferences()
    expect(prefs.evolutionEnabled).toBe(false)
    expect(prefs.costTrackingEnabled).toBe(true)
  })
})
