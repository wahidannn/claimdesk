import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { createClaim, getClaim, listActiveCategories, updateClaim } from '../features/claims/api';
import { getApiErrorMessage } from '../lib/api-error';

const claimSchema = z.object({
  title: z.string().min(1, 'Title wajib diisi').max(160, 'Title maksimal 160 karakter'),
  amount: z.coerce.number().positive('Amount harus lebih besar dari 0'),
  categoryId: z.coerce.number().positive('Category wajib dipilih'),
  transactionDate: z
    .string()
    .min(1, 'Transaction date wajib diisi')
    .refine((value) => value <= new Date().toISOString().slice(0, 10), 'Transaction date tidak boleh di masa depan'),
  description: z.string().max(2000, 'Description maksimal 2000 karakter').optional(),
});

type ClaimFormValues = z.infer<typeof claimSchema>;

export function ClaimFormPage() {
  const navigate = useNavigate();
  const params = useParams();
  const claimId = params.id ? Number(params.id) : null;
  const isEditing = Boolean(claimId);

  const categoriesQuery = useQuery({
    queryKey: ['active-categories'],
    queryFn: listActiveCategories,
  });

  const claimQuery = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => getClaim(claimId as number),
    enabled: isEditing,
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClaimFormValues>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      title: '',
      amount: 0,
      categoryId: 0,
      transactionDate: new Date().toISOString().slice(0, 10),
      description: '',
    },
  });

  useEffect(() => {
    if (claimQuery.data) {
      reset({
        title: claimQuery.data.title,
        amount: Number(claimQuery.data.amount),
        categoryId: claimQuery.data.category.id,
        transactionDate: claimQuery.data.transactionDate,
        description: claimQuery.data.description ?? '',
      });
    }
  }, [claimQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: ClaimFormValues) => {
      const payload = {
        ...values,
        description: values.description ?? '',
      };

      return isEditing ? updateClaim(claimId as number, payload) : createClaim(payload);
    },
    onSuccess: (claim) => {
      navigate(`/claims/${claim.id}`, { replace: true });
    },
    onError: (error) => {
      setError('root', { message: getApiErrorMessage(error, 'Gagal menyimpan claim.') });
    },
  });

  function onSubmit(values: ClaimFormValues) {
    saveMutation.mutate(values);
  }

  const categories = categoriesQuery.data ?? [];

  return (
    <div className="max-w-3xl space-y-5">
      <Button asChild variant="ghost" className="px-0">
        <Link to="/claims">
          <ArrowLeft size={16} />
          Back to claims
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">{isEditing ? 'Edit Claim' : 'Create Claim'}</h1>
        <p className="mt-1 text-sm text-slate-500">Simpan claim sebagai draft sebelum disubmit ke manager.</p>
      </div>

      <form className="space-y-5 rounded-lg border border-border bg-surface p-5 shadow-card" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="text-sm font-medium" htmlFor="title">
            Title
          </label>
          <Input id="title" className="mt-2" {...register('title')} />
          {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor="amount">
              Amount
            </label>
            <Input id="amount" type="number" min="0" step="0.01" className="mt-2" {...register('amount')} />
            {errors.amount && <p className="mt-2 text-sm text-red-600">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="transactionDate">
              Transaction Date
            </label>
            <Input id="transactionDate" type="date" className="mt-2" {...register('transactionDate')} />
            {errors.transactionDate && <p className="mt-2 text-sm text-red-600">{errors.transactionDate.message}</p>}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="categoryId">
            Category
          </label>
          <Select id="categoryId" className="mt-2" {...register('categoryId')}>
            <option value={0}>Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          {errors.categoryId && <p className="mt-2 text-sm text-red-600">{errors.categoryId.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="description">
            Description
          </label>
          <Textarea id="description" className="mt-2" {...register('description')} />
          {errors.description && <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>}
        </div>

        {errors.root && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.root.message}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button asChild variant="secondary">
            <Link to="/claims">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || saveMutation.isPending}>
            Save Draft
          </Button>
        </div>
      </form>
    </div>
  );
}
