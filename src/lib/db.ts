/**
 * Dexie.js configuration: local IndexedDB database
 * All data stays on the user's device
 *
 * This file re-exports all the CRUD helpers, now organized
 * by domain in dedicated files (db-*.ts), to keep a
 * stable public API (`import ... from '@/lib/db'`) without impacting
 * existing callers.
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
