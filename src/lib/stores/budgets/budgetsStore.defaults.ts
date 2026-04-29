export const DEFAULT_STATE = {
  budgets: new Map(),
  year: new Date().getFullYear(),
  loaded: false,
  loading: false,
  dirty: new Set(),
};
