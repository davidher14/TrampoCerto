export type UserRole = "candidate" | "company";

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  user: AuthUser;
}

export interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface CandidateRegistrationData extends LoginFormData {
  full_name: string;
}

export interface CompanyRegistrationData extends LoginFormData {
  company_name: string;
  cnpj: string;
}
