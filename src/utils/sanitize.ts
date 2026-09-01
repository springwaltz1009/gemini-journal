/**
 * Sanitizes an object by recursively removing undefined and invalid values
 * to guarantee compatibility with Firestore database writes.
 */
export function sanitizeFirestorePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestorePayload(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const cleanObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeFirestorePayload(value);
      }
    }
    return cleanObj as unknown as T;
  }

  return obj;
}
