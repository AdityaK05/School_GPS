export interface PushNotificationMessage {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface INotificationProvider {
  sendPush(message: PushNotificationMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export class MockNotificationProvider implements INotificationProvider {
  public sentMessages: PushNotificationMessage[] = [];

  async sendPush(message: PushNotificationMessage): Promise<{ success: boolean; messageId?: string }> {
    this.sentMessages.push(message);
    return { success: true, messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` };
  }
}
