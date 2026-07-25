import { createTransport, type Transporter } from "nodemailer";
import { env } from "@/lib/env";

// =============================================================================
// Types
// =============================================================================

export enum EventType {
  SKILL_PUBLISHED = "skill.published",
  SKILL_UPDATED = "skill.updated",
  SKILL_DELETED = "skill.deleted",
  REVIEW_SUBMITTED = "review.submitted",
  REVIEW_APPROVED = "review.approved",
  REVIEW_REJECTED = "review.rejected",
  REVIEW_CHANGES_REQUESTED = "review.changes_requested",
  USER_INVITED = "user.invited",
  USER_REMOVED = "user.removed",
  SECURITY_ALERT = "security.alert",
}

export interface NotificationPayload {
  event: EventType;
  timestamp: Date;
  data: Record<string, unknown>;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface SlackOptions {
  channel: string;
  text: string;
  blocks?: Record<string, unknown>[];
}

export interface WebhookOptions {
  url: string;
  payload: Record<string, unknown>;
  headers?: Record<string, string>;
}

// =============================================================================
// Message Formatters
// =============================================================================

export function formatSkillPublishedMessage(data: {
  skillName: string;
  version: string;
  authorName: string;
  orgName: string;
}): { subject: string; html: string; slack: string } {
  const subject = `[${data.orgName}] New skill published: ${data.skillName} v${data.version}`;
  const html = `
    <h2>New Skill Published</h2>
    <p><strong>${data.skillName}</strong> v${data.version} by ${data.authorName}</p>
    <p>Organization: ${data.orgName}</p>
    <p>The skill is now available in the Enterprise Skills Hub.</p>
  `.trim();
  const slack = `:rocket: *${data.skillName}* v${data.version} published by ${data.authorName} in ${data.orgName}`;

  return { subject, html, slack };
}

export function formatReviewMessage(data: {
  skillName: string;
  reviewerName: string;
  status: "approved" | "rejected" | "changes_requested";
  comment?: string;
}): { subject: string; html: string; slack: string } {
  const statusLabel = data.status.replace("_", " ");
  const subject = `Review ${statusLabel}: ${data.skillName}`;
  const html = `
    <h2>Skill Review ${statusLabel}</h2>
    <p><strong>${data.skillName}</strong> was ${statusLabel} by ${data.reviewerName}</p>
    ${data.comment ? `<blockquote>${data.comment}</blockquote>` : ""}
  `.trim();
  const slack = `:memo: *${data.skillName}* review ${statusLabel} by ${data.reviewerName}${data.comment ? `\n> ${data.comment}` : ""}`;

  return { subject, html, slack };
}

// =============================================================================
// NotificationService
// =============================================================================

export class NotificationService {
  private readonly transporter: Transporter | null;

  constructor() {
    // Build SMTP transport if credentials are available
    const smtpHost = process.env.SMTP_HOST;
    if (smtpHost) {
      this.transporter = createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
      });
    } else {
      this.transporter = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Email
  // ---------------------------------------------------------------------------

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn("[NotificationService] SMTP not configured — skipping email");
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? "noreply@skills-hub.local",
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      return true;
    } catch (err) {
      console.error("[NotificationService] Email send failed:", err);
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Slack
  // ---------------------------------------------------------------------------

  async sendSlack(options: SlackOptions): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn("[NotificationService] SLACK_WEBHOOK_URL not configured — skipping Slack");
      return false;
    }

    try {
      const body: Record<string, unknown> = {
        channel: options.channel,
        text: options.text,
      };
      if (options.blocks) body.blocks = options.blocks;

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      return res.ok;
    } catch (err) {
      console.error("[NotificationService] Slack send failed:", err);
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Generic Webhook
  // ---------------------------------------------------------------------------

  async sendWebhook(options: WebhookOptions): Promise<boolean> {
    try {
      const res = await fetch(options.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: JSON.stringify(options.payload),
        signal: AbortSignal.timeout(10_000),
      });

      return res.ok;
    } catch (err) {
      console.error("[NotificationService] Webhook send failed:", err);
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Dispatch by event type
  // ---------------------------------------------------------------------------

  async dispatch(payload: NotificationPayload, recipients: {
    emails?: string[];
    slackChannel?: string;
    webhookUrls?: string[];
  }): Promise<void> {
    const promises: Promise<boolean>[] = [];

    if (recipients.emails?.length) {
      const { subject, html } = this.formatByEvent(payload);
      promises.push(this.sendEmail({ to: recipients.emails, subject, html }));
    }

    if (recipients.slackChannel) {
      const { slack } = this.formatByEvent(payload);
      promises.push(this.sendSlack({ channel: recipients.slackChannel, text: slack }));
    }

    if (recipients.webhookUrls?.length) {
      for (const url of recipients.webhookUrls) {
        promises.push(this.sendWebhook({ url, payload: payload as unknown as Record<string, unknown> }));
      }
    }

    await Promise.allSettled(promises);
  }

  // ---------------------------------------------------------------------------
  // Internal formatter
  // ---------------------------------------------------------------------------

  private formatByEvent(payload: NotificationPayload): { subject: string; html: string; slack: string } {
    const data = payload.data;

    switch (payload.event) {
      case EventType.SKILL_PUBLISHED:
        return formatSkillPublishedMessage(data as any);
      case EventType.REVIEW_SUBMITTED:
      case EventType.REVIEW_APPROVED:
      case EventType.REVIEW_REJECTED:
      case EventType.REVIEW_CHANGES_REQUESTED:
        return formatReviewMessage(data as any);
      default:
        return {
          subject: `Event: ${payload.event}`,
          html: `<p>Event <strong>${payload.event}</strong> occurred at ${payload.timestamp.toISOString()}</p>`,
          slack: `Event *${payload.event}* at ${payload.timestamp.toISOString()}`,
        };
    }
  }
}
