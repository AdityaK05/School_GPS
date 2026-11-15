import { AuditLog } from '@school-transport-platform/shared-types';
import { IAuditRepository } from '../../repositories/interfaces';
import crypto from 'crypto';

export class AuditService {
  constructor(private auditRepo: IAuditRepository) {}

  public async log(
    schoolId: string,
    actorUserId: string | undefined,
    action: string,
    entityType: string,
    entityId: string,
    before?: unknown,
    after?: unknown,
    reason?: string
  ): Promise<AuditLog> {
    const record: AuditLog = {
      id: crypto.randomUUID(),
      schoolId,
      actorUserId,
      action,
      entityType,
      entityId,
      before,
      after,
      reason,
      createdAt: new Date().toISOString(),
    };
    return await this.auditRepo.create(record);
  }
}
