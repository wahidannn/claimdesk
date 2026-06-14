import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { ApprovalQueuePage } from '../pages/ApprovalQueuePage';
import { AuditLogsPage } from '../pages/AuditLogsPage';
import { CategoryManagementPage } from '../pages/CategoryManagementPage';
import { ClaimDetailPage } from '../pages/ClaimDetailPage';
import { ClaimFormPage } from '../pages/ClaimFormPage';
import { DashboardPage } from '../pages/DashboardPage';
import { DepartmentManagementPage } from '../pages/DepartmentManagementPage';
import { FinanceReviewPage } from '../pages/FinanceReviewPage';
import { HealthPage } from '../pages/HealthPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ReportsPage } from '../pages/ReportsPage';
import { ReviewDetailPage } from '../pages/ReviewDetailPage';
import { UserManagementPage } from '../pages/UserManagementPage';
import { MyClaimsPage } from '../pages/MyClaimsPage';
import { GuestRoute } from './GuestRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/health',
    element: <HealthPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      {
        path: 'reports',
        element: (
          <RoleRoute roles={['ADMIN', 'EMPLOYEE', 'MANAGER', 'FINANCE']}>
            <ReportsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <RoleRoute roles={['ADMIN']}>
            <UserManagementPage />
          </RoleRoute>
        ),
      },
      {
        path: 'departments',
        element: (
          <RoleRoute roles={['ADMIN']}>
            <DepartmentManagementPage />
          </RoleRoute>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <RoleRoute roles={['ADMIN']}>
            <AuditLogsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'categories',
        element: (
          <RoleRoute roles={['FINANCE']}>
            <CategoryManagementPage />
          </RoleRoute>
        ),
      },
      {
        path: 'claims',
        element: (
          <RoleRoute roles={['EMPLOYEE']}>
            <MyClaimsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'claims/new',
        element: (
          <RoleRoute roles={['EMPLOYEE']}>
            <ClaimFormPage />
          </RoleRoute>
        ),
      },
      {
        path: 'claims/:id',
        element: (
          <RoleRoute roles={['EMPLOYEE']}>
            <ClaimDetailPage />
          </RoleRoute>
        ),
      },
      {
        path: 'claims/:id/edit',
        element: (
          <RoleRoute roles={['EMPLOYEE']}>
            <ClaimFormPage />
          </RoleRoute>
        ),
      },
      {
        path: 'approvals',
        element: (
          <RoleRoute roles={['MANAGER']}>
            <ApprovalQueuePage />
          </RoleRoute>
        ),
      },
      {
        path: 'approvals/:id',
        element: (
          <RoleRoute roles={['MANAGER']}>
            <ReviewDetailPage mode="manager" />
          </RoleRoute>
        ),
      },
      {
        path: 'finance-review',
        element: (
          <RoleRoute roles={['FINANCE']}>
            <FinanceReviewPage />
          </RoleRoute>
        ),
      },
      {
        path: 'finance-review/:id',
        element: (
          <RoleRoute roles={['FINANCE']}>
            <ReviewDetailPage mode="finance" />
          </RoleRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
