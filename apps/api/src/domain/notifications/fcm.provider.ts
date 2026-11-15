import { INotificationProvider, PushNotificationMessage } from './provider.interface';
import { logger } from '@school-transport-platform/utils';

export interface FcmTokenResolver {
  getTokensForUser(userId: string): Promise<string[]>;
}

export interface FcmProviderOptions {
  projectId?: string;
  serverKey?: string;
  tokenResolver: FcmTokenResolver;
  dryRun?: boolean;
}

export class FcmNotificationProvider implements INotificationProvider {
  private projectId: string;
  private serverKey?: string;
  private tokenResolver: FcmTokenResolver;
  private dryRun: boolean;

  constructor(options: FcmProviderOptions) {
    this.projectId = options.projectId || process.env.FIREBASE_PROJECT_ID || 'school-gps-production';
    this.serverKey = options.serverKey || process.env.FIREBASE_SERVER_KEY;
    this.tokenResolver = options.tokenResolver;
    this.dryRun = options.dryRun ?? (process.env.FCM_DRY_RUN === 'true' || !this.serverKey);
  }

  /**
   * Formats payload according to FCM HTTP v1 specification
   */
  public formatFcmPayload(deviceToken: string, message: PushNotificationMessage): Record<string, unknown> {
    return {
      message: {
        token: deviceToken,
        notification: {
          title: message.title,
          body: message.body,
        },
        data: message.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'student_transport_alerts',
            sound: 'default',
            priority: 'max',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      },
    };
  }

  async sendPush(
    message: PushNotificationMessage
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const tokens = await this.tokenResolver.getTokensForUser(message.userId);
      if (!tokens || tokens.length === 0) {
        logger.warn('No active FCM device tokens registered for user', { userId: message.userId });
        return { success: false, error: 'NO_ACTIVE_DEVICE_TOKENS' };
      }

      if (this.dryRun) {
        logger.info('[FCM DRY-RUN] Push notification dispatched', {
          userId: message.userId,
          title: message.title,
          tokenCount: tokens.length,
        });
        return {
          success: true,
          messageId: `fcm_dry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        };
      }

      // Live FCM HTTP v1 API Transmission
      let lastMessageId: string | undefined;
      for (const token of tokens) {
        const payload = this.formatFcmPayload(token, message);
        const res = await fetch(`https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.serverKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errBody = await res.text();
          logger.error('FCM HTTP v1 transmission failed', { status: res.status, err: errBody });
          return { success: false, error: `FCM_ERROR_${res.status}: ${errBody}` };
        }

        const resData: any = await res.json();
        lastMessageId = resData.name;
      }

      return { success: true, messageId: lastMessageId };
    } catch (err: any) {
      logger.error('Unhandled error in FcmNotificationProvider', { error: err.message });
      return { success: false, error: err.message };
    }
  }
}
