'use client';

import * as Icons from '@tabler/icons-react';
import { Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { TCategory } from '@/service/database/categories/getCategories';
import CategoryDetail from './CategoryDetail';
import styles from './CategoryCard.module.css';

type IconName = keyof typeof Icons;

const getIcon = (iconName: string) => {
  const IconComponent = (Icons as Record<string, any>)[iconName] || Icons.IconQuestionMark;
  return IconComponent;
};

const CategoryCard = ({ category }: { category: TCategory }) => {
  const [opened, { open, close }] = useDisclosure(false);
  const IconComponent = getIcon(category.icon);

  return (
    <>
      <Paper
        bg="dark.7"
        px="md"
        py="lg"
        bd="solid 1px dark.7"
        className={styles.wrapper}
        onClick={open}
        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
      >
        <Stack gap={0}>
          <Group gap="md">
            <ThemeIcon
              size="md"
              radius="md"
              variant="light"
              color={category.color}
              className={styles.iconRoot}
            >
              {IconComponent && <IconComponent size={32} />}
            </ThemeIcon>
            <Stack gap={0} style={{ flex: 1 }}>
              <Text c="dimmed" size={'xs'} className={styles.label}>
                {category.segments.length} segmenter
              </Text>
              <Title order={3} className={styles.title} lineClamp={1}>
                {category.label}
              </Title>
            </Stack>
          </Group>
          <Text size="sm" c="dimmed" lineClamp={2} className={styles.description} mt="xs">
            {category.description}
          </Text>
        </Stack>
      </Paper>

      <CategoryDetail category={category} opened={opened} onClose={close} />
    </>
  );
};

export default CategoryCard;
