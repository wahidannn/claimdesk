import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Table, Td, Th } from '../components/ui/Table';
import { createDepartment, listDepartments, updateDepartment, updateDepartmentStatus } from '../features/departments/api';
import type { Department } from '../features/departments/types';
import { listUsers } from '../features/users/api';
import { getApiErrorMessage } from '../lib/api-error';

type DepartmentFormState = {
  name: string;
  managerId: string;
  active: boolean;
};

const emptyForm: DepartmentFormState = {
  name: '',
  managerId: '',
  active: true,
};

export function DepartmentManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [form, setForm] = useState<DepartmentFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const departmentsQuery = useQuery({
    queryKey: ['admin-departments', { page, search }],
    queryFn: () => listDepartments({ page, size: 10, search }),
  });

  const managersQuery = useQuery({
    queryKey: ['admin-users', 'manager-options'],
    queryFn: () => listUsers({ page: 0, size: 100, role: 'MANAGER', active: true }),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        managerId: form.managerId ? Number(form.managerId) : null,
        active: form.active,
      };

      return editingDepartment ? updateDepartment(editingDepartment.id, payload) : createDepartment(payload);
    },
    onSuccess: async () => {
      setNotice(editingDepartment ? 'Department berhasil diperbarui.' : 'Department berhasil dibuat.');
      closeModal();
      await queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
    },
    onError: (mutationError) => {
      setError(getApiErrorMessage(mutationError, 'Gagal menyimpan department.'));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => updateDepartmentStatus(id, active),
    onSuccess: async () => {
      setNotice('Status department berhasil diperbarui.');
      await queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
    },
    onError: (mutationError) => {
      setNotice(getApiErrorMessage(mutationError, 'Gagal memperbarui status department.'));
    },
  });

  const departments = departmentsQuery.data?.items ?? [];
  const managers = managersQuery.data?.items ?? [];
  const totalPages = departmentsQuery.data?.totalPages ?? 0;

  function openCreateModal() {
    setEditingDepartment(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(department: Department) {
    setEditingDepartment(department);
    setForm({
      name: department.name,
      managerId: department.manager?.id ? String(department.manager.id) : '',
      active: department.active,
    });
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingDepartment(null);
    setForm(emptyForm);
    setError(null);
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setPage(0);
    setSearch(draftSearch);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    saveMutation.mutate();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Departments</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola department dan manager penanggung jawab.</p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          <Plus size={16} />
          New Department
        </Button>
      </div>

      {notice && (
        <div className="rounded-md border border-accent/20 bg-accentSoft px-4 py-3 text-sm font-medium text-accent">{notice}</div>
      )}

      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <Input
            className="pl-10"
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Search department"
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
              <Th>Name</Th>
              <Th>Manager</Th>
              <Th>Status</Th>
              <Th className="w-48">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {departments.map((department) => (
              <tr key={department.id}>
                <Td className="font-medium">{department.name}</Td>
                <Td>
                  {department.manager ? (
                    <div>
                      <div>{department.manager.name}</div>
                      <div className="text-sm text-slate-500">{department.manager.email}</div>
                    </div>
                  ) : (
                    '-'
                  )}
                </Td>
                <Td>
                  <Badge className={department.active ? undefined : 'border-slate-200 bg-slate-100 text-slate-600'}>
                    {department.active ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={() => openEditModal(department)}>
                      <Edit size={15} />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => statusMutation.mutate({ id: department.id, active: !department.active })}
                    >
                      {department.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
            {!departmentsQuery.isLoading && departments.length === 0 && (
              <tr>
                <Td colSpan={4} className="text-center text-slate-500">
                  No departments found.
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

      <Modal open={modalOpen} title={editingDepartment ? 'Edit Department' : 'Create Department'} onClose={closeModal}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            value={form.name}
            onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
            placeholder="Department name"
            required
          />
          <Select
            value={form.managerId}
            onChange={(event) => setForm((value) => ({ ...value, managerId: event.target.value }))}
          >
            <option value="">No manager</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm((value) => ({ ...value, active: event.target.checked }))}
            />
            Active
          </label>
          {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
