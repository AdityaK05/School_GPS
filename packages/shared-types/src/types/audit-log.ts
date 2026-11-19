export interface AuditLog {
  id: string;

  schoolId: string;
  actorUserId?: string;

  action: string;

  entityType: string;
  entityId: string;

  before?: unknown;
  after?: unknown;

  reason?: string;

  createdAt: string;
  timestamp?: string;
}