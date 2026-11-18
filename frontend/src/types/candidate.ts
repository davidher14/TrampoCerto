export type WorkMode = "onsite" | "hybrid" | "remote";
export type ContractType =
  | "clt"
  | "pj"
  | "internship"
  | "temporary"
  | "freelance"
  | "apprentice";
export type ApplicationStatus =
  | "sent"
  | "analysis"
  | "interview"
  | "approved"
  | "rejected";

export interface CompanySummary {
  name: string;
  logo_url: string | null;
}

export interface Job {
  id: number;
  company_id: number;
  title: string;
  description: string;
  requirements: string;
  area: string;
  city: string;
  state: string;
  work_mode: WorkMode;
  contract_type: ContractType;
  salary_min: number | string;
  salary_max: number | string | null;
  salary_currency: string;
  status: string;
  created_at: string;
  company: CompanySummary;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

export interface JobSearchParams {
  q?: string;
  city?: string;
  state?: string;
  work_mode?: WorkMode;
  contract_type?: ContractType;
  area?: string;
  salary_min?: number;
  salary_max?: number;
  order_by?: "recent" | "salary_asc" | "salary_desc";
  page: number;
  page_size: number;
}

export interface Experience {
  id: number;
  company_name: string;
  job_title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
}

export interface Education {
  id: number;
  institution: string;
  course: string;
  degree_level: string;
  start_date: string;
  end_date: string | null;
}

export interface Skill {
  id: number;
  name: string;
  proficiency: string | null;
}

export interface Language {
  id: number;
  name: string;
  proficiency: string;
}

export interface CandidateProfile {
  user_id: number;
  full_name: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  headline: string | null;
  summary: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  has_resume: boolean;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
  languages: Language[];
  completion_percentage: number;
}

export interface ExperienceInput {
  company_name: string;
  job_title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
}

export interface EducationInput {
  institution: string;
  course: string;
  degree_level: string;
  start_date: string;
  end_date: string | null;
}

export interface SkillInput {
  name: string;
  proficiency: string | null;
}

export interface LanguageInput {
  name: string;
  proficiency: string;
}

export interface CandidateResumeInput {
  experiences: ExperienceInput[];
  educations: EducationInput[];
  skills: SkillInput[];
  languages: LanguageInput[];
}

export interface ApplicationFeedback {
  id: number;
  status: Exclude<ApplicationStatus, "sent">;
  message: string;
  created_at: string;
}

export interface Application {
  id: number;
  job_id: number;
  candidate_id: number;
  cover_letter: string | null;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
  job: Job;
  feedbacks: ApplicationFeedback[];
}
