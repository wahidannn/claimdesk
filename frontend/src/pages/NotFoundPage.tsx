import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="rounded border border-border bg-surface p-6">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">Halaman yang kamu cari tidak tersedia.</p>
      <Button asChild className="mt-5">
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
