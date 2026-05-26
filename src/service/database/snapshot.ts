// Snapshot data for read-only (deployed) mode.
// Run `yarn export` locally to update these files before pushing.
import categoriesData from '../../data/snapshot/categories.json';
import companiesData from '../../data/snapshot/companies.json';
import dashboardsData from '../../data/snapshot/grafana_dashboards.json';
import segmentsData from '../../data/snapshot/segments.json';
import transactionsData from '../../data/snapshot/transactions.json';

export const categoriesSnapshot = categoriesData as any[];
export const segmentsSnapshot = segmentsData as any[];
export const companiesSnapshot = companiesData as any[];
export const transactionsSnapshot = transactionsData as any[];
export const dashboardsSnapshot = dashboardsData as any[];
