import { TBillsState } from './billsStore.types';

export const DEFAULT_STATE: TBillsState = {
  bills: {},
  transferPlan: {
    monthly: 0,
    start: 0,
  },
  highest: 0,
  lowest: 0,
  total: 0,
};
