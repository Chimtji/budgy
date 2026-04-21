'use server';

import { TServerResponse } from '@/service';
import { isAuthenticated } from '../auth/isAuthenticated';
import { sqlClient } from '../auth/server';

export type TSegment = {
  id: string;
  name: string;
  label: string;
  description: string;
};

export type TCategory = {
  id: string;
  name: string;
  color: string;
  label: string;
  icon: string;
  description: string;
  segments: TSegment[];
};

export type TCategoriesResponse = TCategory[];

export const getCategories = async (): Promise<TServerResponse<TCategoriesResponse>> => {
  const auth = await isAuthenticated();

  if (!auth.success) {
    return auth;
  }

  try {
    // Fetch all categories with their segments in a single query
    const result = await sqlClient`
      SELECT
        c.id as category_id,
        c.name as category_name,
        c.color,
        c.label as category_label,
        c.icon,
        c.description as category_description,
        s.id as segment_id,
        s.name as segment_name,
        s.label as segment_label,
        s.description as segment_description
      FROM categories c
      LEFT JOIN category_segments cs ON c.id = cs.category_id
      LEFT JOIN segments s ON cs.segment_id = s.id
      ORDER BY c.name, s.name
    `;

    // Transform flat result into hierarchical structure
    const categoriesMap = new Map<string, TCategory>();

    result.forEach((row) => {
      if (!categoriesMap.has(row.category_id)) {
        categoriesMap.set(row.category_id, {
          id: row.category_id,
          name: row.category_name,
          color: row.color,
          label: row.category_label,
          icon: row.icon,
          description: row.category_description,
          segments: [],
        });
      }

      if (row.segment_id) {
        const category = categoriesMap.get(row.category_id)!;
        category.segments.push({
          id: row.segment_id,
          name: row.segment_name,
          label: row.segment_label,
          description: row.segment_description,
        });
      }
    });

    const categories = Array.from(categoriesMap.values());

    return { status: 200, success: true, data: categories };
  } catch (error) {
    return {
      status: 500,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
