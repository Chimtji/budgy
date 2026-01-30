import { ScrollArea, SimpleGrid, Stack, Title } from '@mantine/core';
import data from '@/data/categories.json';
import CategoryCard from './_components/CategoryCard';

const Categories = () => {
  return (
    <Stack h="100vh" p="xl">
      <Title order={2}>Kategorier</Title>
      <ScrollArea h="100%">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4, xxl: 5 }}>
          {/* {data.map((category) => (
            <CategoryCard {...category} />
          ))} */}
        </SimpleGrid>
      </ScrollArea>
    </Stack>
  );
};

export default Categories;
