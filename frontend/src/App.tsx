import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '@constants/routes';
import { PageLayout } from '@components/layout/PageLayout/PageLayout';
import { ToastContainer } from '@components/atoms';
import { useToast } from '@hooks/useToast';
import { useNotifications } from '@hooks/useNotifications';
import { Dashboard } from '@pages/Dashboard/Dashboard';
import { WatchersPage } from '@pages/Watchers/WatchersPage';
import { LogsPage } from '@pages/Logs/LogsPage';
import { ImagesPage } from '@pages/Images/ImagesPage';
import { CookiesPage } from '@pages/Cookies/CookiesPage';
import { WorkflowsPage } from '@pages/Workflows/WorkflowsPage';
import { WorkflowCreatePage } from '@pages/Workflows/WorkflowCreatePage';
import { ChangeLogsPage } from '@pages/ChangeLogs/ChangeLogsPage';

function App() {
  const { toasts, removeToast } = useToast();
  const { startListening } = useNotifications();

  // Start listening for notifications when app loads
  React.useEffect(() => {
    startListening();
  }, [startListening]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PageLayout />}>
          <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.WATCHERS} element={<WatchersPage />} />
          <Route path={ROUTES.LOGS} element={<LogsPage />} />
          <Route path={ROUTES.IMAGES} element={<ImagesPage />} />
          <Route path={ROUTES.COOKIES} element={<CookiesPage />} />
          <Route path={ROUTES.WORKFLOWS} element={<WorkflowsPage />} />
          <Route path={ROUTES.WORKFLOW_CREATE} element={<WorkflowCreatePage />} />
          <Route path={ROUTES.CHANGE_LOGS} element={<ChangeLogsPage />} />
        </Route>
      </Routes>
      
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </BrowserRouter>
  );
}

export default App;
