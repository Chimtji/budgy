export const companies = ['oister', 'lime'] as const;
export type TCompany = (typeof companies)[number];
