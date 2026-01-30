'use client';

import Image from 'next/image';
import * as Icons from '@tabler/icons-react';
import { Avatar, Button, Card, Group, Text, ThemeIcon } from '@mantine/core';
import classes from './CategoryCard.module.css';

const stats = [{ value: '34K', label: 'Segmenter' }];

type TProps = {
  id: string;
  label: string;
  description: string;
  image: string;
  icon: string;
  color: string;
  segments: {
    id: string;
    label: string;
    description: string;
  }[];
};

const CategoryCard: React.FC<TProps> = (category) => {
  const items = stats.map((stat) => (
    <div key={stat.label}>
      <Text ta="center" fz="lg" fw={500}>
        {stat.value}
      </Text>
      <Text ta="center" fz="sm" c="dimmed" lh={1}>
        {stat.label}
      </Text>
    </div>
  ));

  const Icon = Icons[category.icon as keyof typeof Icons] as Icons.Icon;

  return (
    <Card withBorder padding="xl" radius="md" className={classes.card}>
      <Card.Section h={140} pos="relative">
        <Image src={category.image} alt="" fill objectFit="cover" sizes="300px" />
      </Card.Section>
      <ThemeIcon
        color={category.color}
        size={80}
        radius={80}
        mx="auto"
        mt={-30}
        className={classes.avatar}
      >
        {Icon && <Icon size={40} stroke={1.5} />}
      </ThemeIcon>
      <Text ta="center" fz="lg" fw={500} mt="sm">
        {category.label}
      </Text>
      <Text ta="center" fz="sm" c="dimmed">
        {category.description}
      </Text>
      <Group mt="md" justify="center" gap={30}>
        <div>
          <Text ta="center" fz="lg" fw={500}>
            {category.segments.length}
          </Text>
          <Text ta="center" fz="sm" c="dimmed" lh={1}>
            Segmenter
          </Text>
        </div>
      </Group>
      <Button fullWidth radius="md" mt="xl" size="md" variant="default">
        Vis mere
      </Button>
    </Card>
  );
};

export default CategoryCard;
