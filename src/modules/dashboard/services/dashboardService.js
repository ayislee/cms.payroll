import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  if (params.companyId) query.append('company_id', params.companyId);
  if (params.periodStart) query.append('period_start', params.periodStart);
  if (params.periodEnd) query.append('period_end', params.periodEnd);

  return query.toString();
};

class DashboardService {
  async getOverview(params = {}) {
    const query = buildQuery(params);
    return apiClient.get(query ? `${API_ENDPOINTS.DASHBOARD.OVERVIEW}?${query}` : API_ENDPOINTS.DASHBOARD.OVERVIEW);
  }

  async getCompanyPeriodSummary(params = {}) {
    const query = buildQuery(params);
    return apiClient.get(
      query
        ? `${API_ENDPOINTS.DASHBOARD.COMPANY_PERIOD_SUMMARY}?${query}`
        : API_ENDPOINTS.DASHBOARD.COMPANY_PERIOD_SUMMARY,
      { timeout: 120000 }
    );
  }
}

export default new DashboardService();
