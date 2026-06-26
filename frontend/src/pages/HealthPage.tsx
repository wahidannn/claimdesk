import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { LoadingState, Spinner } from '../components/ui/Spinner';
import { apiClient } from '../lib/api-client';

type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

async function getHealth() {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
}

export function HealthPage() {
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
  });

  return (
    <div className="rounded border border-border bg-surface p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">API Health</h1>
          <p className="mt-2 text-sm text-slate-600">Menguji koneksi frontend ke backend.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => healthQuery.refetch()}>
          {healthQuery.isFetching ? <Spinner size="sm" /> : <RefreshCw size={16} />}
          Refresh
        </Button>
      </div>

      <div className="mt-6 rounded border border-border bg-muted p-4">
        {healthQuery.isLoading && <LoadingState className="py-4" label="Loading health status..." />}
        {healthQuery.isError && (
          <p className="text-sm text-red-600">Backend belum bisa dihubungi. Pastikan API berjalan.</p>
        )}
        {healthQuery.data && (
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Status</dt>
              <dd className="mt-1 font-semibold text-green-700">{healthQuery.data.status}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Service</dt>
              <dd className="mt-1 font-semibold">{healthQuery.data.service}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Timestamp</dt>
              <dd className="mt-1 font-semibold">{healthQuery.data.timestamp}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
