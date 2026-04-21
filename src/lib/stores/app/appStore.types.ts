export type TAppStore = {
  year: number;
  userId: string | null;
  setYear: (year: number) => void;
  setUserId: (userId: string | null) => void;
  cleanData: () => Promise<void>;
};
