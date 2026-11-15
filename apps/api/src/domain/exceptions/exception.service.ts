import { JourneyException } from '@school-transport-platform/shared-types';
import { IExceptionRepository } from '../../repositories/interfaces';
import { AuditService } from '../audit/audit.service';

export class ExceptionService {
  constructor(
    private exceptionRepo: IExceptionRepository,
    private auditService: AuditService
  ) {}

  public async resolveException(
    exceptionId: string,
    resolvedByUserId: string,
    reason: string
  ): Promise<JourneyException> {
    if (!reason || reason.trim().length < 5) {
      throw new Error('Resolution reason must be at least 5 characters for compliance');
    }

    const exception = await this.exceptionRepo.findById(exceptionId);
    if (!exception) throw new Error(`Exception ${exceptionId} not found`);

    const now = new Date().toISOString();
    const updated = await this.exceptionRepo.update(exceptionId, {
      status: 'RESOLVED',
      resolvedAt: now,
      resolvedBy: resolvedByUserId,
      resolutionReason: reason,
    });

    await this.auditService.log(
      exception.schoolId,
      resolvedByUserId,
      'EXCEPTION_RESOLVED',
      'exceptions',
      exceptionId,
      { previousStatus: exception.status },
      { status: 'RESOLVED', resolvedAt: now },
      reason
    );

    return updated;
  }
}
