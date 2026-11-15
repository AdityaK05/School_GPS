import { Notification, Student } from '@school-transport-platform/shared-types';
import { INotificationRepository, IStudentRepository } from '../../repositories/interfaces';
import { INotificationProvider } from './provider.interface';
import crypto from 'crypto';

export class NotificationService {
  constructor(
    private notificationRepo: INotificationRepository,
    private studentRepo: IStudentRepository,
    private provider: INotificationProvider
  ) {}

  public async notifyGuardians(
    studentId: string,
    schoolId: string,
    type: 'BOARDING' | 'EXIT' | 'EXCEPTION',
    title: string,
    body: string
  ): Promise<Notification[]> {
    const guardians = await this.studentRepo.findGuardiansByStudent(studentId);
    const notifications: Notification[] = [];

    for (const guardian of guardians) {
      if (!guardian.notificationEnabled) continue;

      const record: Notification = {
        id: crypto.randomUUID(),
        userId: guardian.userId,
        schoolId,
        type,
        title,
        body,
        createdAt: new Date().toISOString(),
      };

      await this.notificationRepo.create(record);
      await this.provider.sendPush({
        userId: guardian.userId,
        title,
        body,
        data: { studentId, type },
      });

      notifications.push(record);
    }

    return notifications;
  }
}
