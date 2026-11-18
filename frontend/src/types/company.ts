import type { ApplicationFeedback, Job } from "./candidate";

export interface CompanyProfile {
  id: number;
  user_id: number;
  name: string;
  cnpj: string;
  description: string | null;
  website: string | null;
  has_logo: boolean;
  logo_url: string | null;
}

export interface CompanyProfileInput {
  name: string;
  description: string | null;
  website: string | null;
}

export interface CompanyDashboard {
  active_jobs: number;
  total_applications: number;
  pending_feedback: number;
}

export interface CompanyApplication {
  id: number;
  job_id: number;
  candidate_id: number;
  candidate_name: string;
  candidate_email: string;
  headline: string | null;
  city: string | null;
  state: string | null;
  status: string;
  applied_at: string;
  cover_letter: string | null;
  has_resume: boolean;
  feedbacks: ApplicationFeedback[];
}

export interface CompanyCandidateProfile {
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
  completion_percentage: number;
  experiences: Array<{
    id: number;
    company_name: string;
    job_title: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
  }>;
  educations: Array<{
    id: number;
    institution: string;
    course: string;
    degree_level: string;
    start_date: string;
    end_date: string | null;
  }>;
  skills: Array<{ id: number; name: string; proficiency: string | null }>;
  languages: Array<{ id: number; name: string; proficiency: string }>;
}

export interface CompanyJobInput {
  title: string;
  description: string;
  requirements: string;
  area: string;
  city: string;
  state: string;
  work_mode: Job["work_mode"];
  contract_type: Job["contract_type"];
  salary_min: number;
  salary_max: number | null;
  status: "draft" | "open";
}

export interface PendingCandidate {
  application_id: number;
  name: string;
  email: string;
}
