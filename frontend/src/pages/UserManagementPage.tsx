import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Search } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Table, Td, Th } from '../components/ui/Table';
import { listDepartments } from '../features/departments/api';
import type { Role } from '../features/auth/types';
import { createUser, listUsers, updateUser, updateUserStatus } from '../features/users/api';
import type { ManagedUser } from '../features/users/types';
import { getApiErrorMessage } from '../lib/api-error';

const roles: Role[] = ['ADMIN', 'EMPLOYEE', 'MANAGER', 'FINANCE'];

type UserFormState = {
  name: string;
  email: string;
  password: string;
  role: Role;
  departmentId: string;
  active: boolean;
};

const emptyForm: UserFormState = {
  name: '',
  email: '',
  password: '',
  role: 'EMPLOYEE',
  departmentId: '',
  active: true,
};

export function UserManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ['admin-users', { page, search }],
    queryFn: () => listUsers({ page, size: 10, search }),
  });

  const departmentsQuery = useQuery({
    queryKey: ['admin-departments', 'active-options'],
    queryFn: () => listDepartments({ page: 0, size: 100, active: true }),
  });

  const departments = departmentsQuery.data?.items ?? [];
  const isEditing = Boolean(editingUser);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        active: form.active,
      };

      if (editingUser) {
        return updateUser(editingUser.id, {
          ...payload,
          password: form.password || undefined,
        });
      }

      return createUser({
        ...payload,
        password: form.password,
      });
    },
    onSuccess: async () => {
      setNotice(isEditing ? 'User berhasil diperbarui.' : 'User berhasil dibuat.');
      closeModal();
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (mutationError) => {
      setError(getApiErrorMessage(mutationError, 'Gagal menyimpan user.'));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => updateUserStatus(id, active),
    onSuccess: async () => {
      setNotice('Status user berhasil diperbarui.');
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (mutationError) => {
      setNotice(getApiErrorMessage(mutationError, 'Gagal memperbarui status user.'));
    },
  });

  const users = usersQuery.data?.items ?? [];
  const totalPages = usersQuery.data?.totalPages ?? 0;

  const modalTitle = useMemo(() => (editingUser ? 'Edit User' : 'Create User'), [editingUser]);

  function openCreateModal() {
    setEditingUser(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(user: ManagedUser) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      departmentId: user.department?.id ? String(user.department.id) : '',
      active: user.active,
    });
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingUser(null);
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
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola user, role, department, dan status akses.</p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          <Plus size={16} />
          New User
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
            placeholder="Search name or email"
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
              <Th>Role</Th>
              <Th>Department</Th>
              <Th>Status</Th>
              <Th className="w-48">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accentSoft text-xs font-bold text-accent">
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-sm text-mutedText">{user.email}</div>
                    </div>
                  </div>
                </Td>
                <Td>{user.role}</Td>
                <Td>{user.department?.name ?? '-'}</Td>
                <Td>
                  <Badge className={user.active ? undefined : 'border-slate-200 bg-slate-100 text-slate-600'}>
                    {user.active ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={() => openEditModal(user)}>
                      <Edit size={15} />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => statusMutation.mutate({ id: user.id, active: !user.active })}
                    >
                      {user.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
            {!usersQuery.isLoading && users.length === 0 && (
              <tr>
                <Td colSpan={5} className="text-center text-slate-500">
                  No users found.
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

      <Modal open={modalOpen} title={modalTitle} onClose={closeModal}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            value={form.name}
            onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
            placeholder="Name"
            required
          />
          <Input
            type="email"
            value={form.email}
            onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
            placeholder="Email"
            required
          />
          <Input
            type="password"
            value={form.password}
            onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))}
            placeholder={isEditing ? 'New password optional' : 'Password'}
            required={!isEditing}
            minLength={isEditing && !form.password ? undefined : 8}
          />
          <Select
            value={form.role}
            onChange={(event) => setForm((value) => ({ ...value, role: event.target.value as Role }))}
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
          <Select
            value={form.departmentId}
            onChange={(event) => setForm((value) => ({ ...value, departmentId: event.target.value }))}
          >
            <option value="">No department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
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
