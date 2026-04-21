'use client';

import { useEffect } from 'react';
import { IconFolderOff } from '@tabler/icons-react';
import { Center, Container, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useShallow } from 'zustand/shallow';
import { useCategoriesStore } from '@/stores/categories/categoriesStore';
import CategoryCard from './_components/CategoryCard';

export default function CategoriesPage() {
  const { categories, loading, getAll } = useCategoriesStore(
    useShallow((state) => ({
      categories: state.categories,
      loading: state.loading,
      getAll: state.getAll,
    }))
  );

  useEffect(() => {
    getAll();
  }, [getAll]);

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="xs">
            Kategorier & Segmenter
          </Title>
          <Text c="dimmed" size="md">
            Oversigt over alle dine budgetkategorier og deres segmenter
          </Text>
        </div>

        {loading ? (
          <Text c="dimmed">Indlæser kategorier...</Text>
        ) : categories.length === 0 ? (
          <Center py="xl">
            <Stack gap="md" align="center">
              <IconFolderOff size={48} opacity={0.5} />
              <div style={{ textAlign: 'center' }}>
                <Title order={3} mb="xs">
                  Ingen kategorier fundet
                </Title>
                <Text c="dimmed">Start med at oprette nogle kategorier</Text>
              </div>
            </Stack>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
