import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
  timestamp?: string;
}

export interface AuthPayload {
  token: string;
  tokenType: string;
  userId: number;
  email: string;
  fullName: string;
  message: string;
}

export interface UploadPayload {
  totalRows: number;
  parsedSuccessfully: number;
  failedRows: number;
  message: string;
  errors?: string[];
}

export interface DashboardTransaction {
  id: number;
  transactionDate: string;
  description: string;
  normalizedDescription: string;
  amount: number;
  category: string;
  subscription: boolean;
}

export type TransactionPayload = DashboardTransaction;

export interface DashboardOverviewPayload {
  financialHabitScore: number;
  creditScore: number;
  subscriptionWaste: number;
  monthlySpending: number;
  savingsRatio: number;
  spendingStability: number;
  categoryBreakdown: Record<string, number>;
  subscriptions: SubscriptionPayload[];
  topTransactions: DashboardTransaction[];
  creditScoreRating: string;
  habitScoreRating: string;
}

export interface SubscriptionPayload {
  id: number;
  serviceName: string;
  monthlyAmount: number;
  occurrenceCount: number;
  active: boolean;
}

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fintwin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authService = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthPayload>>('/auth/login', { email, password }),
  register: (fullName: string, email: string, password: string) =>
    api.post<ApiResponse<AuthPayload>>('/auth/register', { fullName, email, password }),
};

export const transactionService = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<UploadPayload>>('/transactions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getTransactions: () => api.get<ApiResponse<TransactionPayload[]>>('/transactions'),
};

export const analyticsService = {
  getDashboard: () => api.get<ApiResponse<DashboardOverviewPayload>>('/dashboard/overview'),
  getSubscriptions: () => api.get<ApiResponse<SubscriptionPayload[]>>('/analytics/subscriptions'),
  recompute: () => api.post('/analytics/recompute'),
};

export const emailReportService = {
  sendFinancialReport: () => api.post<ApiResponse<string>>('/email/send-report'),
};

export default api;
