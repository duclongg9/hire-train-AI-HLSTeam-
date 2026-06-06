export function readStorage(storage: Storage | undefined, key: string) {
  if (!storage) return null
  return storage.getItem(key)
}

export function writeStorage(storage: Storage | undefined, key: string, value: string) {
  if (!storage) return
  storage.setItem(key, value)
}

export function removeStorage(storage: Storage | undefined, key: string) {
  if (!storage) return
  storage.removeItem(key)
}

