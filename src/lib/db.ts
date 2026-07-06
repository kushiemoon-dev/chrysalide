/**
 * Configuration Dexie.js - Base de données locale IndexedDB
 * Toutes les données restent sur l'appareil de l'utilisateur
 *
 * Ce fichier ré-exporte l'ensemble des helpers CRUD, désormais organisés
 * par domaine dans des fichiers dédiés (db-*.ts), pour conserver une
 * API publique stable (`import ... from '@/lib/db'`) sans impacter les
 * appelants existants.
 */

export { db } from './db-schema'

export * from './db-medications'
export * from './db-blood-tests'
export * from './db-physical-progress'
export * from './db-appointments'
export * from './db-user-profile'
export * from './db-export-import'
export * from './db-reminders'
export * from './db-journal'
export * from './db-objectives'
export * from './db-treatment-changes'
export * from './db-practitioners'
export * from './db-acts'
