/** The backend's own message for a failed request (Spring sends `message` or `error`), else a fallback. */
export const apiError = (e: unknown, fallback: string): string => {
  const data = (e as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  const body = data as { message?: string; error?: string } | undefined;
  return body?.message ?? body?.error ?? fallback;
};
