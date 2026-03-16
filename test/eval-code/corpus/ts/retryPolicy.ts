export type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: boolean;
};

export function exponentialBackoff(policy: RetryPolicy, attempt: number): number {
  const exp = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** Math.max(0, attempt - 1));
  if (!policy.jitter) return exp;
  return Math.floor(exp * (0.5 + Math.random() * 0.5));
}
