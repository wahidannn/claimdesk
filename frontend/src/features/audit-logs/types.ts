import type { PagedResponse } from '../../lib/api-types';
import type { Role } from '../auth/types';

export type AuditAction =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_STATUS_CHANGED'
  | 'DEPARTMENT_CREATED'
  | 'DEPARTMENT_UPDATED'
  | 'DEPARTMENT_STATUS_CHANGED'
  | 'CATEGORY_CREATED'
  | 'CATEGORY_UPDATED'
  | 'CATEGORY_STATUS_CHANGED'
  | 'CLAIM_CREATED'
  | 'CLAIM_UPDATED'
  | 'CLAIM_SUBMITTED'
  | 'CLAIM_REVISION_REQUESTED'
  | 'CLAIM_REVISED'
  | 'CLAIM_CANCELLED'
  | 'ATTACHMENT_UPLOADED'
  | 'ATTACHMENT_DELETED'
  | 'CLAIM_MANAGER_APPROVED'
  | 'CLAIM_MANAGER_REJECTED'
  | 'CLAIM_FINANCE_APPROVED'
  | 'CLAIM_PAID';

export type AuditResourceType = 'AUTH' | 'USER' | 'DEPARTMENT' | 'CATEGORY' | 'CLAIM' | 'ATTACHMENT';

export type AuditLog = {
  id: number;
  actorId: number | null;
  actorEmail: string | null;
  actorRole: Role | null;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: number | null;
  description: string;
  metadata: string | null;
  createdAt: string;
};

export type AuditLogListParams = {
  page?: number;
  size?: number;
  search?: string;
  actorEmail?: string;
  actorRole?: Role | '';
  action?: AuditAction | '';
  resourceType?: AuditResourceType | '';
  resourceId?: number | '';
  dateFrom?: string;
  dateTo?: string;
};

export type AuditLogListResponse = PagedResponse<AuditLog>;
