import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '@constants/routes';
import { PageLayout } from '@components/layout/PageLayout/PageLayout';
import { Dashboard } from '@pages/Dashboard/Dashboard';
import { MonitorsPage } from '@pages/Monitors/MonitorsPage';
import { MonitorCreatePage } from '@pages/Monitors/MonitorCreatePage';
import { MonitorEditPage } from '@pages/Monitors/MonitorEditPage';
import { LogsPage } from '@pages/Logs/LogsPage';
import { RequestsPage } from '@pages/Requests/RequestsPage';
import { ImagesPage } from '@pages/Images/ImagesPage';
import { CookiesPage } from '@pages/Cookies/CookiesPage';
import { WorkflowsPage } from '@pages/Workflows/WorkflowsPage';
import { WorkflowCreatePage } from '@pages/Workflows/WorkflowCreatePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PageLayout />}>
          <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.MONITORS} element={<MonitorsPage />} />
          <Route path={ROUTES.MONITOR_CREATE} element={<MonitorCreatePage />} />
          <Route path="/monitors/:id/edit" element={<MonitorEditPage />} />
          <Route path={ROUTES.LOGS} element={<LogsPage />} />
          <Route path={ROUTES.REQUESTS} element={<RequestsPage />} />
          <Route path={ROUTES.IMAGES} element={<ImagesPage />} />
          <Route path={ROUTES.COOKIES} element={<CookiesPage />} />
          <Route path={ROUTES.WORKFLOWS} element={<WorkflowsPage />} />
          <Route path={ROUTES.WORKFLOW_CREATE} element={<WorkflowCreatePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
