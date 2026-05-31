// Типы API

// Auth
export interface LoginResponse {
  user_id: number;
  email: string;
  session_token: string;
  full_name: string;
  is_admin: boolean;
  message: string;
}

export interface CurrentUser {
  user_id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
}

// Admin
export interface UserSearchItem {
  user_id: number;
  email: string;
  full_name: string;
  phone: string;
  is_admin: boolean;
  created_at: string;
}

export interface ResetPasswordResponse {
  user_id: number;
  email: string;
  new_password: string;
  message: string;
}

export interface Profile {
  user_id: number;
  full_name: string;
  phone: string;
  email: string;
  photo_url: string | null;
  is_complete: boolean;
}

// Dictionaries
export interface ProfessionalField { field_id: number; field_name: string }
export interface ResumeStatus { status_id: number; status_name: string }
export interface SkillCategory { category_id: number; category_name: string }
export interface ExperienceType { type_id: number; type_name: string }
export interface Discipline { discipline_id: number; discipline_name: string }
export interface FileFormat { format_id: number; extension: string }
export interface EducationalProgram {
  program_id: number;
  program_code: string;
  program_name: string;
  faculty: string;
  degree_level: string;
}
export interface Language { language_id: number; language_name: string }

// Resume
export interface Skill {
  skill_id: number;
  skill_name: string;
  category_id: number;
  is_custom: boolean; 
}
export interface Position {
  position_id: number;
  position_name: string;
  field_id: number;
  company: string | null;
}
export interface Template {
  template_id: number;
  template_name: string;
  description: string | null;
  style_file: string;
}
export interface Education {
  education_id: number;
  institution: string;
  program_id: number;
  start_year: number | null;
  graduation_year: number;
}
export interface Experience {
  experience_id: number;
  project_name: string;
  description: string | null;
  type_id: number;
  discipline_id: number | null;
}
export interface ResumeSkill {
  skill_id: number;
  skill_name: string;
  category_name: string;
  skill_level: string;
}
export interface ResumeLanguage {
  language_id: number;
  language_name: string;
  proficiency: string;
}
export interface ResumeListItem {
  resume_id: number;
  title: string;
  creation_date: string;
  status_name: string;
  position_name: string;
  template_name: string;
  progress: number;
}
export interface ResumeDetail {
  resume_id: number;
  title: string;
  owner_full_name: string;
  owner_email: string;
  creation_date: string;
  status_id: number;
  status_name: string;
  position: Position;
  template: Template;
  educations: Education[];
  experiences: Experience[];
  skills: ResumeSkill[];
  languages: ResumeLanguage[];
  progress: number;
  created_at: string;
}

// Portfolio
export interface PortfolioItem {
  portfolio_item_id: number;
  file_name: string;
  storage_url: string;
  experience_id: number | null;
  format_id: number;
  file_size: number;
  created_at: string;
}

// AI
export interface AiImproveRequest {
  text: string;
  field_type?: string;
  target_position?: string;
}
export interface AiImproveResponse {
  variants: string[];
  used_mock: boolean;
}
