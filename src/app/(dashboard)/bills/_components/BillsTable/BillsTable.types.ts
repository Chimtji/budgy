import { TCategoryName, TMonthIndex, TSegmentName } from '@/data/types';
import { TBills } from '@/stores/bills/billsStore.types';

export type TBillsTableProps = {
  bills: TBills;
  title: string;
  search: string;
};

export type TBillRow = {
  amount: number;
  companyName: string;
  companyDomain: string;
  companyId: number;
  category: TCategoryName;
  segment: TSegmentName;
  status: string;
  due: TMonthIndex[];
  id: number;
  name: string;
};
