import { createHmac } from "crypto";

// =============================================================================
// Types
// =============================================================================

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
  deliveryId: string;
}

export interface WebhookConfig {
  id: string;
  url: string;
  secret: string;
  events: string[]; // event types to subscribe to, or ["*"] for all
  active: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface DeliveryResult {
  deliveryId: string;
  webhookId: string;
  success: boolean;
  statusCode?: number;
  attempts: number;
  error?: string;
  deliveredAt: Date;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_TIMEOUT_MS = 10_000;
const BASE_BACKOFF_MS = 1_000;

// =============================================================================
// WebhookDispatcher
// =============================================================================

export class WebhookDispatcher {
  // ---------------------------------------------------------------------------
  // Payload Signing (HMAC-SHA256)
  // ---------------------------------------------------------------------------

  signWebhookPayload(payload: string, secret: string): string {
    return createHmac("sha256", secret).update(payload).digest("hex");
  }

  // ---------------------------------------------------------------------------
  // Deliver with retry
  // ---------------------------------------------------------------------------

  async deliver(config: WebhookConfig, payload: WebhookPayload): Promise<DeliveryResult> {
    const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const body = JSON.stringify(payload);
    const signature = this.signWebhookPayload(body, config.secret);

    let lastError: Error | undefined;
    let lastStatusCode: number | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(config.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": `sha256=${signature}`,
            "X-Webhook-Delivery": payload.deliveryId,
            "X-Webhook-Event": payload.event,
            "User-Agent": "SkillsHub-Webhook/1.0",
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timer);
        lastStatusCode = res.status;

        if (res.ok) {
          return {
            deliveryId: payload.deliveryId,
            webhookId: config.id,
            success: true,
            statusCode: res.status,
            attempts: attempt,
            deliveredAt: new Date(),
          };
        }

        // 4xx (except 429) are not retryable
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          lastError = new Error(`Webhook rejected with status ${res.status}`);
          break;
        }

        lastError = new Error(`Webhook delivery failed with status ${res.status}`);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }

      // Exponential backoff before next attempt (skip sleep on last attempt)
      if (attempt < maxRetries) {
        const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
        await this.sleep(backoff);
      }
    }

    return {
      deliveryId: payload.deliveryId,
      webhookId: config.id,
      success: false,
      statusCode: lastStatusCode,
      attempts: maxRetries,
      error: lastError?.message,
      deliveredAt: new Date(),
    };
  }

  // ---------------------------------------------------------------------------
  // Verify incoming webhook signature (for receiving webhooks)
  // ---------------------------------------------------------------------------

  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = this.signWebhookPayload(payload, secret);
    const received = signature.replace("sha256=", "");

    // Timing-safe comparison
    if (expected.length !== received.length) return false;

    let result = 0;
    for (let i = 0; i < expected.length; i++) {
      result |= expected.charCodeAt(i) ^ received.charCodeAt(i);
    }
    return result === 0;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
