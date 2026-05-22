import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { showErrorNotification } from '@/notifications/feedback';
import { createCategory } from '@/service/database/categories/create';
import { deleteCategory } from '@/service/database/categories/delete';
import { getAllCategories, type TCategory } from '@/service/database/categories/getAll';
import { updateCategory } from '@/service/database/categories/update';
import { createSegment } from '@/service/database/segments/create';
import { deleteSegment } from '@/service/database/segments/delete';
import { getAllSegments, type TSegment } from '@/service/database/segments/getAll';
import { updateSegment } from '@/service/database/segments/update';

type TState = {
  categories: TCategory[];
  segments: TSegment[];
};

type TActions = {
  initCategories: () => Promise<void>;
  addCategory: (data: Omit<TCategory, 'id'>) => Promise<void>;
  updateCategory: (data: Omit<TCategory, 'id'>) => Promise<void>;
  removeCategory: (key: string) => Promise<void>;
  addSegment: (data: Omit<TSegment, 'id'>) => Promise<void>;
  updateSegment: (data: Pick<TSegment, 'id' | 'label' | 'description'>) => Promise<void>;
  removeSegment: (id: string) => Promise<void>;
};

export const useCategoriesStore = create<TState & TActions>()(
  persist(
    subscribeWithSelector(
      immer((set) => ({
        categories: [],
        segments: [],

        initCategories: async () => {
          const [catResult, segResult] = await Promise.all([getAllCategories(), getAllSegments()]);
          if (!catResult.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke hente kategorier' });
            return;
          }
          if (!segResult.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke hente segmenter' });
            return;
          }
          set((state) => {
            state.categories = catResult.data;
            state.segments = segResult.data;
          });
        },

        addCategory: async (data) => {
          const result = await createCategory(data);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke oprette kategori' });
            return;
          }
          set((state) => {
            state.categories.push(result.data);
          });
        },

        updateCategory: async (data) => {
          const result = await updateCategory(data);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke opdatere kategori' });
            return;
          }
          set((state) => {
            const idx = state.categories.findIndex((c) => c.key === data.key);
            if (idx !== -1) state.categories[idx] = result.data;
          });
        },

        removeCategory: async (key) => {
          const result = await deleteCategory(key);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke slette kategori' });
            return;
          }
          set((state) => {
            state.categories = state.categories.filter((c) => c.key !== key);
            state.segments = state.segments.filter((s) => s.category_key !== key);
          });
        },

        addSegment: async (data) => {
          const result = await createSegment(data);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke oprette segment' });
            return;
          }
          set((state) => {
            state.segments.push(result.data);
          });
        },

        updateSegment: async (data) => {
          const result = await updateSegment(data);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke opdatere segment' });
            return;
          }
          set((state) => {
            const idx = state.segments.findIndex((s) => s.id === data.id);
            if (idx !== -1) state.segments[idx] = result.data;
          });
        },

        removeSegment: async (id) => {
          const result = await deleteSegment(id);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke slette segment' });
            return;
          }
          set((state) => {
            state.segments = state.segments.filter((s) => s.id !== id);
          });
        },
      }))
    ),
    { name: 'categories-store' }
  )
);
