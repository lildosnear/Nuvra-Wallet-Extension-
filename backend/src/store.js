// Dev store: in-memory tables with optional JSON file persistence.
// The table shapes mirror the backend spec (users, passkeys,
// sessions, wallets, verification codes, audit logs) so moving to
// PostgreSQL later is a storage swap, not a redesign.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const TABLES = ['users', 'passkeys', 'sessions', 'wallets', 'codes', 'audit']

export function createStore(file = null) {
  const data = Object.fromEntries(TABLES.map((t) => [t, []]))
  if (file && existsSync(file)) {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    for (const t of TABLES) if (Array.isArray(parsed[t])) data[t] = parsed[t]
  }
  const save = () => { if (file) writeFileSync(file, JSON.stringify(data, null, 2)) }
  return {
    data,
    save,
    insert(table, row) { data[table].push(row); save(); return row },
    find(table, pred) { return data[table].find(pred) || null },
    filter(table, pred) { return data[table].filter(pred) },
    update(table, pred, patch) {
      const row = data[table].find(pred)
      if (row) { Object.assign(row, patch); save() }
      return row
    },
    remove(table, pred) {
      data[table] = data[table].filter((r) => !pred(r))
      save()
    },
    audit(event, details = {}) {
      data.audit.push({ at: new Date().toISOString(), event, ...details })
      save()
    },
  }
}
