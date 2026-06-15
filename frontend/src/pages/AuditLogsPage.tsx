import { useQuery } from '@tanstack/react-query';
import { Eye, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Table, Td, Th } from '../components/ui/Table';
import { listAuditLogs } from '../features/audit-logs/api';
import type { AuditAction, AuditLog, AuditResourceType } from '../features/audit-logs/types';
import type { Role } from '../features/auth/types';

const roles: Role[] = ['ADMIN', 'EMPLOYEE', 'MANAGER', 'FINANCE'];

const actions: AuditAction[] = [
  'AUTH_LOGIN',
  'AUTH_LOGOUT',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_STATUS_CHANGED',
  'DEPARTMENT_CREATED',
  'DEPARTMENT_UPDATED',
  'DEPARTMENT_STATUS_CHANGED',
  'CATEGORY_CREATED',
  'CATEGORY_UPDATED',
  'CATEGORY_STATUS_CHANGED',
  'CLAIM_CREATED',
  'CLAIM_UPDATED',
  'CLAIM_SUBMITTED',
  'CLAIM_REVISION_REQUESTED',
  'CLAIM_REVISED',
  'CLAIM_COMMENT_CREATED',
  'CLAIM_CANCELLED',
  'ATTACHMENT_UPLOADED',
  'ATTACHMENT_DELETED',
  'CLAIM_MANAGER_APPROVED',
  'CLAIM_MANAGER_REJECTED',
  'CLAIM_FINANCE_APPROVED',
  'CLAIM_PAID',
];

const resourceTypes: AuditResourceType[] = ['AUTH', 'USER', 'DEPARTMENT', 'CATEGORY', 'CLAIM', 'ATTACHMENT'];

export function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    actorEmail: '',
    actorRole: '',
    action: '',
    resourceType: '',
    resourceId: '',
    dateFrom: '',
    dateTo: '',
  });
  const [draftFilters, setDraftFilters] = useState(filters);

  const auditLogsQuery = useQuery({
    queryKey: ['audit-logs', { page, filters }],
    queryFn: () =>
      listAuditLogs({
        page,
        size: 10,
        search: filters.search,
        actorEmail: filters.actorEmail,
        actorRole: filters.actorRole as Role | '',
        action: filters.action as AuditAction | '',
        resourceType: filters.resourceType as AuditResourceType | '',
        resourceId: filters.resourceId ? Number(filters.resourceId) : '',
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      }),
  });

  const auditLogs = auditLogsQuery.data?.items ?? [];
  const totalPages = auditLogsQuery.data?.totalPages ?? 0;

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setPage(0);
    setFilters(draftFilters);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-500">Jejak aktivitas penting lintas modul ClaimDesk.</p>
      </div>

      <form className="grid gap-3 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_1fr_auto]" onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <Input
            className="pl-10"
            value={draftFilters.search}
            onChange={(event) => setDraftFilters((value) => ({ ...value, search: event.target.value }))}
            placeholder="Search description"
          />
        </div>
        <Input
          value={draftFilters.actorEmail}
          onChange={(event) => setDraftFilters((value) => ({ ...value, actorEmail: event.target.value }))}
          placeholder="Actor email"
        />
        <Select
          value={draftFilters.actorRole}
          onChange={(event) => setDraftFilters((value) => ({ ...value, actorRole: event.target.value }))}
        >
          <option value="">All roles</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </Select>
        <Select
          value={draftFilters.action}
          onChange={(event) => setDraftFilters((value) => ({ ...value, action: event.target.value }))}
        >
          <option value="">All actions</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </Select>
        <Select
          value={draftFilters.resourceType}
          onChange={(event) => setDraftFilters((value) => ({ ...value, resourceType: event.target.value }))}
        >
          <option value="">All resources</option>
          {resourceTypes.map((resourceType) => (
            <option key={resourceType} value={resourceType}>
              {resourceType}
            </option>
          ))}
        </Select>
        <Input
          type="number"
          value={draftFilters.resourceId}
          onChange={(event) => setDraftFilters((value) => ({ ...value, resourceId: event.target.value }))}
          placeholder="Resource ID"
          min={1}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={draftFilters.dateFrom}
            onChange={(event) => setDraftFilters((value) => ({ ...value, dateFrom: event.target.value }))}
          />
          <Input
            type="date"
            value={draftFilters.dateTo}
            onChange={(event) => setDraftFilters((value) => ({ ...value, dateTo: event.target.value }))}
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
        <Table>
          <thead>
            <tr>
              <Th>Time</Th>
              <Th>Actor</Th>
              <Th>Action</Th>
              <Th>Resource</Th>
              <Th>Description</Th>
              <Th className="w-28">Detail</Th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((auditLog) => (
              <tr key={auditLog.id}>
                <Td className="whitespace-nowrap text-slate-600">{auditLog.createdAt}</Td>
                <Td>
                  <div className="font-medium">{auditLog.actorEmail ?? '-'}</div>
                  <div className="text-sm text-slate-500">{auditLog.actorRole ?? '-'}</div>
                </Td>
                <Td>
                  <Badge>{auditLog.action}</Badge>
                </Td>
                <Td>
                  <div className="font-medium">{auditLog.resourceType}</div>
                  <div className="text-sm text-slate-500">ID: {auditLog.resourceId ?? '-'}</div>
                </Td>
                <Td>{auditLog.description}</Td>
                <Td>
                  <Button type="button" variant="secondary" onClick={() => setSelectedLog(auditLog)}>
                    <Eye size={15} />
                    View
                  </Button>
                </Td>
              </tr>
            ))}
            {!auditLogsQuery.isLoading && auditLogs.length === 0 && (
              <tr>
                <Td colSpan={6} className="text-center text-slate-500">
                  No audit logs found.
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
            Previous
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Modal open={selectedLog !== null} title="Audit Detail" onClose={() => setSelectedLog(null)}>
        {selectedLog && (
          <div className="space-y-4 text-sm">
            <DetailItem label="Actor" value={`${selectedLog.actorEmail ?? '-'} (${selectedLog.actorRole ?? '-'})`} />
            <DetailItem label="Action" value={selectedLog.action} />
            <DetailItem label="Resource" value={`${selectedLog.resourceType} #${selectedLog.resourceId ?? '-'}`} />
            <DetailItem label="Description" value={selectedLog.description} />
            <div>
              <p className="font-medium text-slate-500">Metadata</p>
              <pre className="mt-2 max-h-80 overflow-auto rounded border border-border bg-muted p-3 text-xs">
                {formatMetadata(selectedLog.metadata)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-ink">{value}</p>
    </div>
  );
}

function formatMetadata(metadata: string | null) {
  if (!metadata) {
    return '-';
  }

  try {
    return JSON.stringify(JSON.parse(metadata), null, 2);
  } catch {
    return metadata;
  }
}
