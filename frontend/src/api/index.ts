import { apiRequest, downloadUrl } from './client';
import type {
  AiImproveRequest,
  AiImproveResponse,
  CurrentUser,
  Discipline,
  Education,
  EducationalProgram,
  Experience,
  ExperienceType,
  FileFormat,
  Language,
  LoginResponse,
  PortfolioItem,
  Position,
  Profile,
  ProfessionalField,
  ResetPasswordResponse,
  ResumeDetail,
  ResumeLanguage,
  ResumeListItem,
  ResumeSkill,
  ResumeStatus,
  Skill,
  SkillCategory,
  Template,
  UserSearchItem,
} from '@/types/api';

// Auth
export const authApi = {
  login: (login: string, password: string) =>
    apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { login, password },
    }),
  register: (email: string, password: string, full_name: string) =>
    apiRequest<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: { email, password, full_name },
    }),
  logout: () => apiRequest<void>('/api/auth/logout', { method: 'POST' }),
  me: () => apiRequest<CurrentUser>('/api/auth/me'),
};

// Profile
export const profileApi = {
  get: () => apiRequest<Profile>('/api/profile'),
  update: (data: { full_name: string; phone: string; email: string }) =>
    apiRequest<Profile>('/api/profile', { method: 'PUT', body: data }),
  uploadPhoto: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<Profile>('/api/profile/photo', {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  },
  deletePhoto: () => apiRequest<Profile>('/api/profile/photo', { method: 'DELETE' }),
};

// Dictionaries
export const dictApi = {
  programs: () => apiRequest<EducationalProgram[]>('/api/dictionaries/programs'),
  fields: () => apiRequest<ProfessionalField[]>('/api/dictionaries/professional-fields'),
  skillCategories: () => apiRequest<SkillCategory[]>('/api/dictionaries/skill-categories'),
  experienceTypes: () => apiRequest<ExperienceType[]>('/api/dictionaries/experience-types'),
  disciplines: () => apiRequest<Discipline[]>('/api/dictionaries/disciplines'),
  fileFormats: () => apiRequest<FileFormat[]>('/api/dictionaries/file-formats'),
  resumeStatuses: () => apiRequest<ResumeStatus[]>('/api/dictionaries/resume-statuses'),
  languages: () => apiRequest<Language[]>('/api/dictionaries/languages'),
};

// Skills
export const skillsApi = {
  list: () => apiRequest<Skill[]>('/api/skills'),
  create: (skill_name: string, category_id: number) =>
    apiRequest<Skill>('/api/skills', { method: 'POST', body: { skill_name, category_id } }),
  update: (id: number, data: { skill_name?: string; category_id?: number }) =>
    apiRequest<Skill>(`/api/skills/${id}`, { method: 'PATCH', body: data }),
  delete: (id: number) => apiRequest<void>(`/api/skills/${id}`, { method: 'DELETE' }),
};

// Positions
export const positionsApi = {
  list: () => apiRequest<Position[]>('/api/positions'),
  create: (data: { position_name: string; field_id: number; company?: string }) =>
    apiRequest<Position>('/api/positions', { method: 'POST', body: data }),
  update: (id: number, data: { position_name?: string; field_id?: number; company?: string | null }) =>
    apiRequest<Position>(`/api/positions/${id}`, { method: 'PATCH', body: data }),
};

// Templates
export const templatesApi = {
  list: () => apiRequest<Template[]>('/api/templates'),
};

// Resumes
export const resumesApi = {
  list: () => apiRequest<ResumeListItem[]>('/api/resumes'),
  get: (id: number) => apiRequest<ResumeDetail>(`/api/resumes/${id}`),
  create: (data: {
    title: string;
    owner_full_name: string;
    owner_email: string;
    position_id: number;
    template_id: number;
  }) => apiRequest<ResumeDetail>('/api/resumes', { method: 'POST', body: data }),
  update: (id: number, data: Partial<{
    title: string;
    owner_full_name: string;
    owner_email: string;
    position_id: number;
    template_id: number;
    status_id: number;
  }>) => apiRequest<ResumeDetail>(`/api/resumes/${id}`, { method: 'PATCH', body: data }),
  delete: (id: number) => apiRequest<void>(`/api/resumes/${id}`, { method: 'DELETE' }),

  addEducation: (rid: number, data: { institution?: string; program_id: number; start_year?: number | null; graduation_year: number }) =>
    apiRequest<Education>(`/api/resumes/${rid}/educations`, { method: 'POST', body: data }),
  updateEducation: (rid: number, eid: number, data: Partial<Education>) =>
    apiRequest<Education>(`/api/resumes/${rid}/educations/${eid}`, { method: 'PATCH', body: data }),
  deleteEducation: (rid: number, eid: number) =>
    apiRequest<void>(`/api/resumes/${rid}/educations/${eid}`, { method: 'DELETE' }),

  addExperience: (rid: number, data: {
    project_name: string;
    description?: string | null;
    type_id: number;
    discipline_id?: number | null;
  }) =>
    apiRequest<Experience>(`/api/resumes/${rid}/experiences`, { method: 'POST', body: data }),
  updateExperience: (rid: number, xid: number, data: Partial<Experience>) =>
    apiRequest<Experience>(`/api/resumes/${rid}/experiences/${xid}`, { method: 'PATCH', body: data }),
  deleteExperience: (rid: number, xid: number) =>
    apiRequest<void>(`/api/resumes/${rid}/experiences/${xid}`, { method: 'DELETE' }),

  setSkills: (rid: number, skills: { skill_id: number; skill_level: string }[]) =>
    apiRequest<ResumeSkill[]>(`/api/resumes/${rid}/skills`, { method: 'PUT', body: skills }),

  setLanguages: (rid: number, languages: { language_id: number; proficiency: string }[]) =>
    apiRequest<ResumeLanguage[]>(`/api/resumes/${rid}/languages`, { method: 'PUT', body: languages }),
};

// Portfolio
export const portfolioApi = {
  list: () => apiRequest<PortfolioItem[]>('/api/portfolio'),
  upload: (file: File, experienceId?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    const url = experienceId
      ? `/api/portfolio/upload?experience_id=${experienceId}`
      : '/api/portfolio/upload';
    return apiRequest<PortfolioItem>(url, { method: 'POST', body: formData, isFormData: true });
  },
  attach: (id: number, experienceId: number | null) =>
    apiRequest<PortfolioItem>(`/api/portfolio/${id}`, {
      method: 'PATCH',
      body: { experience_id: experienceId },
    }),
  delete: (id: number) => apiRequest<void>(`/api/portfolio/${id}`, { method: 'DELETE' }),
};

// AI
export const aiApi = {
  improve: (payload: AiImproveRequest) =>
    apiRequest<AiImproveResponse>('/api/ai/improve', { method: 'POST', body: payload }),
};

// Export
export const exportApi = {
  pdfUrl: (resumeId: number) => downloadUrl(`/api/resumes/${resumeId}/export/pdf`),
  docxUrl: (resumeId: number) => downloadUrl(`/api/resumes/${resumeId}/export/docx`),
};

// Admin
export const adminApi = {
  searchUsers: (search: string = '') => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest<UserSearchItem[]>(`/api/admin/users${q}`);
  },
  resetPassword: (userId: number, newPassword: string) =>
    apiRequest<ResetPasswordResponse>(`/api/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: { new_password: newPassword },
    }),
};
