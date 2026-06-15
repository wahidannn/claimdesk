import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, Td, Th } from '../components/ui/Table';
import { Textarea } from '../components/ui/Textarea';
import { createCategory, listCategories, updateCategory, updateCategoryStatus } from '../features/categories/api';
import type { ExpenseCategory } from '../features/categories/types';
import { getApiErrorMessage } from '../lib/api-error';

type CategoryFormState = {
  name: string;
  description: string;
  active: boolean;
};

const emptyForm: CategoryFormState = {
  name: '',
  description: '',
  active: true,
};

export function CategoryManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['finance-categories', { page, search }],
    queryFn: () => listCategories({ page, size: 10, search }),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        description: form.description,
        active: form.active,
      };

      return editingCategory ? updateCategory(editingCategory.id, payload) : createCategory(payload);
    },
    onSuccess: async () => {
      setNotice(editingCategory ? 'Category berhasil diperbarui.' : 'Category berhasil dibuat.');
      closeModal();
      await queryClient.invalidateQueries({ queryKey: ['finance-categories'] });
    },
    onError: (mutationError) => {
      setError(getApiErrorMessage(mutationError, 'Gagal menyimpan category.'));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => updateCategoryStatus(id, active),
    onSuccess: async () => {
      setNotice('Status category berhasil diperbarui.');
      await queryClient.invalidateQueries({ queryKey: ['finance-categories'] });
    },
    onError: (mutationError) => {
      setNotice(getApiErrorMessage(mutationError, 'Gagal memperbarui status category.'));
    },
  });

  const categories = categoriesQuery.data?.items ?? [];
  const totalPages = categoriesQuery.data?.totalPages ?? 0;

  function openCreateModal() {
    setEditingCategory(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(category: ExpenseCategory) {
    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description ?? '',
      active: category.active,
    });
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCategory(null);
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
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola kategori expense untuk klaim reimbursement.</p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          <Plus size={16} />
          New Category
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
            placeholder="Search category"
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
              <Th>Description</Th>
              <Th>Status</Th>
              <Th className="w-48">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <Td className="font-medium">{category.name}</Td>
                <Td className="max-w-lg text-slate-600">{category.description ?? '-'}</Td>
                <Td>
                  <Badge className={category.active ? undefined : 'border-slate-200 bg-slate-100 text-slate-600'}>
                    {category.active ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={() => openEditModal(category)}>
                      <Edit size={15} />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => statusMutation.mutate({ id: category.id, active: !category.active })}
                    >
                      {category.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
            {!categoriesQuery.isLoading && categories.length === 0 && (
              <tr>
                <Td colSpan={4} className="text-center text-slate-500">
                  No categories found.
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

      <Modal open={modalOpen} title={editingCategory ? 'Edit Category' : 'Create Category'} onClose={closeModal}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            value={form.name}
            onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
            placeholder="Category name"
            required
          />
          <Textarea
            value={form.description}
            onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))}
            placeholder="Description"
          />
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
