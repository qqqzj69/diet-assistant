import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardPage from '@/pages/DashboardPage/DashboardPage';
import FoodsPage from '@/pages/FoodsPage/FoodsPage';
import RecordsPage from '@/pages/RecordsPage/RecordsPage';
import AssistantPage from '@/pages/AssistantPage/AssistantPage';
import PlanPage from '@/pages/PlanPage/PlanPage';
import ExercisePage from '@/pages/ExercisePage/ExercisePage';
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="foods" element={<FoodsPage />} />
        <Route path="records" element={<RecordsPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="exercise" element={<ExercisePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
