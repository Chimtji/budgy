import { TCategory } from '@/service/database/categories/getCategories';

export type TCategoriesState = {
  categories: TCategory[];
  loading: boolean;
  loaded: boolean;
};

export type TCategoriesStateActions = {
  getAll: () => void;
  clean: () => Promise<void>;
};

export type TCategoriesStore = TCategoriesState & TCategoriesStateActions;
