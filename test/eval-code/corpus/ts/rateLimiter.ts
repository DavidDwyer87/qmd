export class TokenBucket {
  private tokens: number;
  private readonly maxTokens: number;
  private readonly refillRatePerSecond: number;
  private lastRefillAt: number;

  constructor(maxTokens = 100, refillRatePerSecond = 1) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRatePerSecond = refillRatePerSecond;
    this.lastRefillAt = Date.now();
  }

  allow(cost = 1): boolean {
    this.refill();
    if (this.tokens < cost) return false;
    this.tokens -= cost;
    return true;
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillAt) / 1000;
    if (elapsedSeconds <= 0) return;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsedSeconds * this.refillRatePerSecond);
    this.lastRefillAt = now;
  }
}
