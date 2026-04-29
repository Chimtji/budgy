'use client';

import { useMemo } from 'react';
import { Select, Stack } from '@mantine/core';
import categories from '@/data/categories.json';

interface CategorySegmentAssignerProps {
  categoryId: string | null;
  segmentId: string | null;
  onCategoryChange: (categoryId: string) => void;
  onSegmentChange: (segmentId: string) => void;
}

export default function CategorySegmentAssigner({
  categoryId,
  segmentId,
  onCategoryChange,
  onSegmentChange,
}: CategorySegmentAssignerProps) {
  const categoryOptions = useMemo(
    () =>
      Object.entries(categories).map(([_key, cat]) => ({
        value: cat.id,
        label: cat.label,
      })),
    []
  );

  const segmentOptions = useMemo(() => {
    if (!categoryId) return [];
    for (const cat of Object.values(categories)) {
      if (cat.id === categoryId) {
        return Object.entries(cat.segments).map(([_key, seg]) => ({
          value: seg.id,
          label: seg.label,
        }));
      }
    }
    return [];
  }, [categoryId]);

  return (
    <Stack gap="md">
      <Select
        label="Kategori"
        placeholder="Vælg kategori"
        data={categoryOptions}
        value={categoryId}
        onChange={(value) => {
          if (value) {
            onCategoryChange(value);
            onSegmentChange('');
          }
        }}
        searchable
      />

      {categoryId && (
        <Select
          label="Segment"
          placeholder="Vælg segment"
          data={segmentOptions}
          value={segmentId || ''}
          onChange={(value) => {
            if (value) {
              onSegmentChange(value);
            }
          }}
          searchable
        />
      )}
    </Stack>
  );
}
