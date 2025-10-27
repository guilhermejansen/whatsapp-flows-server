import { logger } from '../../../infrastructure/logging/winston-logger';

/**
 * FlowTokenMapper - Maps flow_token to flow_name for automatic flow identification
 *
 * Strategy: 3-layer fallback system
 * 1. Path parameter /:flowName (primary)
 * 2. Token mapping cache (fallback for ping → INIT sequence)
 * 3. Default flow from env (last resort)
 *
 * Use Case:
 * - WhatsApp sends ping with flow in URL: /flows/endpoint/csat-feedback
 * - Mapper stores: flow_token → "csat-feedback"
 * - WhatsApp sends INIT without flow in URL: /flows/endpoint
 * - Mapper retrieves: "csat-feedback" from flow_token
 */
// TODO: Implement FlowTokenMapper in system redis
export class FlowTokenMapper {
  private cache: Map<string, { flowName: string; expiresAt: number }> = new Map();
  private readonly TTL = 60 * 60 * 1000; // 1 hour TTL

  /**
   * Store flow_token → flow_name mapping (called during ping)
   */
  public async setFlowName(flowToken: string, flowName: string): Promise<void> {
    if (!flowToken || !flowName) return;

    const expiresAt = Date.now() + this.TTL;
    this.cache.set(flowToken, { flowName, expiresAt });

    logger.debug('Flow token mapping stored', {
      flowToken,
      flowName,
      expiresAt: new Date(expiresAt).toISOString(),
      cacheSize: this.cache.size,
    });

    // Cleanup expired entries periodically
    this.cleanupExpiredEntries();
  }

  /**
   * Retrieve flow_name from flow_token (called during INIT fallback)
   */
  public async getFlowName(flowToken: string): Promise<string | undefined> {
    if (!flowToken) return undefined;

    const entry = this.cache.get(flowToken);
    if (!entry) {
      logger.debug('Flow token mapping not found', { flowToken });
      return undefined;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(flowToken);
      logger.debug('Flow token mapping expired', { flowToken, flowName: entry.flowName });
      return undefined;
    }

    logger.debug('Flow token mapping retrieved', {
      flowToken,
      flowName: entry.flowName,
    });

    return entry.flowName;
  }

  /**
   * Remove expired entries from cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [token, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(token);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug('Cleaned up expired flow token mappings', {
        removedCount,
        remainingCount: this.cache.size,
      });
    }
  }

  /**
   * Clear all mappings (useful for testing)
   */
  public clear(): void {
    this.cache.clear();
    logger.info('All flow token mappings cleared');
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    size: number;
    entries: Array<{ flowToken: string; flowName: string; expiresAt: string }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([flowToken, entry]) => ({
      flowToken,
      flowName: entry.flowName,
      expiresAt: new Date(entry.expiresAt).toISOString(),
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}
