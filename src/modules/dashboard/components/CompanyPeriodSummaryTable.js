import React from 'react';
import { CAlert, CSpinner } from '@coreui/react';
import { formatCurrency, formatPayrollPeriod } from '../../../utils/formatters';
import './CompanyPeriodSummaryTable.scss';

const metricDefinitions = [
  ['total_employees', 'Total Pegawai', 'number'],
  ['active_employees', 'Pegawai Aktif', 'number'],
  ['inactive_employees', 'Pegawai Tidak Aktif', 'number'],
  ['checked_net_pay', 'NetPay Checked', 'currency'],
  ['unchecked_net_pay', 'NetPay Unchecked', 'currency'],
  ['checked_payrolls', 'Payroll Checked', 'number'],
  ['unchecked_payrolls', 'Payroll Unchecked', 'number'],
  ['emailed_payrolls', 'Payroll Emailed', 'number'],
  ['attendance_records', 'Kehadiran', 'number'],
  ['attendance_sufficiency_percent', 'Kecukupan Kehadiran', 'percent']
];

const formatMetric = (value, type) => {
  if (type === 'currency') return formatCurrency(value, { maximumFractionDigits: 0 });
  if (type === 'percent') return `${Number(value || 0)}%`;
  return Number(value || 0).toLocaleString('id-ID');
};

const CompanyPeriodSummaryTable = ({ periods = [], companies = [], loading, error }) => {
  if (loading) {
    return <div className="text-center py-4"><CSpinner size="sm" /> <span className="ms-2">Memuat ringkasan...</span></div>;
  }

  if (error) return <CAlert color="danger" className="mb-0">{error}</CAlert>;
  if (!companies.length) return <div className="text-center text-medium-emphasis py-4">Tidak ada data perusahaan pada periode ini.</div>;

  return (
    <div className="company-period-table-wrapper">
      <table className="table table-bordered align-middle mb-0 company-period-table">
        <thead>
          <tr>
            <th scope="col" className="company-period-company-column">Nama Perusahaan</th>
            {periods.map((period) => (
              <th scope="col" key={period.period} className="company-period-period-column">
                {period.label || formatPayrollPeriod(period.period)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.company_id}>
              <th scope="row" className="company-period-company-column">{company.company_name}</th>
              {periods.map((period) => {
                const metrics = company.periods?.[period.period] || {};
                return (
                  <td key={`${company.company_id}-${period.period}`} className="company-period-period-column">
                    <div className="company-period-metrics">
                      {metricDefinitions.map(([key, label, type]) => (
                        <div className="company-period-metric" key={key}>
                          <span>{label}</span>
                          <strong>{formatMetric(metrics[key], type)}</strong>
                        </div>
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyPeriodSummaryTable;
