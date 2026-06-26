import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { GuestRoute } from './GuestRoute';
import { LazyPage } from './LazyPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

const ApprovalQueuePage = lazy(() => import('../pages/ApprovalQueuePage').then((module) => ({ default: module.ApprovalQueuePage })));
const AuditLogsPage = lazy(() => import('../pages/AuditLogsPage').then((module) => ({ default: module.AuditLogsPage })));
const CategoryManagementPage = lazy(() => import('../pages/CategoryManagementPage').then((module) => ({ default: module.CategoryManagementPage })));
const ClaimDetailPage = lazy(() => import('../pages/ClaimDetailPage').then((module) => ({ default: module.ClaimDetailPage })));
const ClaimFormPage = lazy(() => import('../pages/ClaimFormPage').then((module) => ({ default: module.ClaimFormPage })));
const DashboardPage = lazy(() => import('../pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const DepartmentManagementPage = lazy(() => import('../pages/DepartmentManagementPage').then((module) => ({ default: module.DepartmentManagementPage })));
const FinanceReviewPage = lazy(() => import('../pages/FinanceReviewPage').then((module) => ({ default: module.FinanceReviewPage })));
const HealthPage = lazy(() => import('../pages/HealthPage').then((module) => ({ default: module.HealthPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const MyClaimsPage = lazy(() => import('../pages/MyClaimsPage').then((module) => ({ default: module.MyClaimsPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));
const ReportsPage = lazy(() => import('../pages/ReportsPage').then((module) => ({ default: module.ReportsPage })));
const ReviewDetailPage = lazy(() => import('../pages/ReviewDetailPage').then((module) => ({ default: module.ReviewDetailPage })));
const UserManagementPage = lazy(() => import('../pages/UserManagementPage').then((module) => ({ default: module.UserManagementPage })));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LazyPage>
          <LoginPage />
        </LazyPage>
      </GuestRoute>
    ),
  },
  {
    path: '/health',
    element: (
      <LazyPage>
        <HealthPage />
      </LazyPage>
    ),
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
      {
        path: 'dashboard',
        element: (
          <LazyPage>
            <DashboardPage />
          </LazyPage>
        ),
      },
      {
        path: 'reports',
        element: (
          <RoleRoute roles={['ADMIN', 'EMPLOYEE', 'MANAGER', 'FINANCE']}>
            <LazyPage>
              <ReportsPage />
            </LazyPage>
          </RoleRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <RoleRoute roles={['ADMIN']}>
            <LazyPage>
              <UserManagementPage />
            </LazyPage>
          </RoleRoute>
        ),
      },
      {
        path: 'departments',
        element: (
          <RoleRoute roles={['ADMIN']}>
            <LazyPage>
              <DepartmentManagementPage />
            </LazyPage>
          </RoleRoute>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <RoleRoute roles={['ADMIN']}>
            <LazyPage>
              <AuditLogsPage />
            </LazyPage>
          </RoleRoute>
        ),
      },
      {
        path: 'categories',
        element: (
          <RoleRoute roles={['FINANCE']}>
            <LazyPage>
              <CategoryManagementPage />
            </LazyPage>
          </RoleRoute>
        ),
      },
      {
        path: 'claims',
        element: (
          <RoleRoute roles={['EMPLOYEE']}>
            <LazyPage>
              <MyClaimsPage />
            </LazyPage>
          </RoleRoute>
        ),
      },
      {
        path: 'claims/new',
        element: (
          <RoleRoute roles={['EMPLOYEE']}>
            <LazyPage>
              <ClaimFormPage />
            </LazyPage>
          </RoleRoute>
        ),
      },
      {
        path: 'claims/:id',
        element: (
          <RoleRoute roles={['EMPLOYEE']}>
            <LazyPage>
              <ClaimDetailPage />
            </LazyPage>
          </RoleRoute>
        ),
      },
      {
        path: 'claims/:id/edit',
        element: (
          <RoleRoute roles={['EMPLOYEE']}>
            <LazyPage>
              <ClaimFormPage />
            </LazyPage>
          </RoleRoute>
        ),
      },
      {
        path: 'approvals',
        element: (
          <RoleRoute roles={['MANAGER']}>
            <LazyPage>
              <ApprovalQueuePage />
            </LazyPage>
          </RoleRoute>
        ),
      },
      {
        path: 'approvals/:id',
        element: (
          <RoleRoute roles={['MANAGER']}>
            <LazyPage>
              <ReviewDetailPage mode="manager" />
            </LazyPage>
          </RoleRoute>
        ),
      },
      {
        path: 'finance-review',
        element: (
          <RoleRoute roles={['FINANCE']}>
            <LazyPage>
              <FinanceReviewPage />
            </LazyPage>
          </RoleRoute>
        ),
      },
      {
        path: 'finance-review/:id',
        element: (
          <RoleRoute roles={['FINANCE']}>
            <LazyPage>
              <ReviewDetailPage mode="finance" />
            </LazyPage>
          </RoleRoute>
        ),
      },
      {
        path: '*',
        element: (
          <LazyPage>
            <NotFoundPage />
          </LazyPage>
        ),
      },
    ],
  },
]);
