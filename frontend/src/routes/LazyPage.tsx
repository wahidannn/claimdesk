import { Suspense, type ReactNode } from 'react';
import { LoadingState } from '../components/ui/Spinner';

function PageLoader() {
  return <LoadingState className="min-h-[240px]" label="Loading page..." />;
}

export function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}
