type InFlightValue = Promise<unknown>;

const inFlight = new Map<string, InFlightValue>();

export function dedupePromise<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = factory().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
  return promise;
}

export interface FetchJsonResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
}

export function fetchJsonDedupe<T>(
  key: string,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<FetchJsonResult<T>> {
  return dedupePromise<FetchJsonResult<T>>(key, async () => {
    const response = await fetch(input, init);
    let data: T | null = null;
    try {
      data = (await response.json()) as T;
    } catch {
      data = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  });
}
