// ========================================
// EMPLOYEE BENEFIT SERVICE
// ========================================

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return ['true', '1', 'yes', 'y', 'on'].includes(String(value).trim().toLowerCase());
};

class EmployeeBenefitService {
  async getEmployeeBenefits(employeeId) {
    try {
      if (!employeeId) {
        throw new Error('Invalid employee ID');
      }

      const response = await apiClient.get(API_ENDPOINTS.EMPLOYEE_BENEFITS.LIST(employeeId));
      const rawData = response?.data || response;
      const benefits = Array.isArray(rawData) ? rawData : [];
      return benefits.map((benefit) => this.formatEmployeeBenefit(benefit));
    } catch (error) {
      console.error('Error fetching employee benefits:', error);
      throw this.handleError(error);
    }
  }

  async toggleEmployeeBenefit(employeeId, companyBenefitId, isActive) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.EMPLOYEE_BENEFITS.TOGGLE, {
        employee_id: employeeId,
        company_benefit_id: companyBenefitId,
        is_active: Boolean(isActive)
      });

      return response.data || response;
    } catch (error) {
      console.error('Error toggling employee benefit:', error);
      throw this.handleError(error);
    }
  }

  formatEmployeeBenefit(benefit) {
    const mainComponent = benefit?.mainComponent || benefit?.main_component || null;
    const employeePercentage = Number(benefit?.employee_percentage ?? 0);
    const employerPercentage = Number(benefit?.employer_percentage ?? 0);
    const totalPercentage = Number(benefit?.total_percentage ?? employeePercentage + employerPercentage);

    return {
      company_benefit_id: benefit?.company_benefit_id ?? null,
      employee_company_benefit_id: benefit?.employee_company_benefit_id ?? null,
      employee_id: benefit?.employee_id ?? null,
      company_id: benefit?.company_id ?? null,
      name: benefit?.name ?? 'Benefit',
      benefit_type: benefit?.benefit_type ?? '',
      description: benefit?.description ?? '',
      employee_percentage: Number.isFinite(employeePercentage) ? employeePercentage : 0,
      employer_percentage: Number.isFinite(employerPercentage) ? employerPercentage : 0,
      total_percentage: Number.isFinite(totalPercentage) ? totalPercentage : 0,
      main_component_id: benefit?.main_component_id ?? null,
      main_component: mainComponent,
      max_base: benefit?.max_base ?? null,
      is_active: toBoolean(benefit?.is_active, true),
      is_taxable: toBoolean(benefit?.is_taxable, false),
      is_assigned: toBoolean(benefit?.is_assigned, false),
      employee_benefit_active: toBoolean(benefit?.employee_benefit_active, false),
      effective_date: benefit?.effective_date ?? '',
      expired_date: benefit?.expired_date ?? ''
    };
  }

  handleError(error) {
    if (error.response) {
      const message = error.response.data?.message || error.message;
      return new Error(message || 'Failed to process employee benefit');
    }

    if (error.request) {
      return new Error('Network Error: Please check your connection');
    }

    return new Error(error.message || 'Unexpected employee benefit error');
  }
}

const employeeBenefitService = new EmployeeBenefitService();

export default employeeBenefitService;
