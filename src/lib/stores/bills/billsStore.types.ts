import { TCategoryName, TMonthIndex, TSegmentName } from '@/data/types';

export type TBill = {
  due: TMonthIndex[];
  companyId: number;
  companyName: string;
  companyDomain: string;
  category: TCategoryName;
  segment: TSegmentName;
  amount: number;
  year: number;
  name: string;
};

export type TAllBills = { [year: number]: TBills };

export type TBills = { [id: string]: TBill };

export type TBillsState = {
  bills: TAllBills;
  transferPlan: {
    monthly: number;
    start: number;
  };
  highest: number;
  lowest: number;
  total: number;
};

export type TBillsStateActions = {
  add: (bill: TBill) => void;
  edit: (bill: TBill, id: number) => void;
  delete: (id: number) => void;
  getAllOfYear: (year: number) => void;
};

export type TBillsStore = TBillsState & TBillsStateActions;
