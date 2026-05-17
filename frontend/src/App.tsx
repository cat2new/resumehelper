import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { StudentLayout } from '@/layouts/StudentLayout';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { DashboardPage } from '@/pages/student/Dashboard';
import { ResumeEditorPage } from '@/pages/student/ResumeEditor';
import { PortfolioPage } from '@/pages/student/Portfolio';
import { ProfilePage } from '@/pages/student/Profile';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/resumes/:id" element={<ResumeEditorPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
