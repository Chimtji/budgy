'use client';

import { useState } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import { DonutChart } from '@mantine/charts';
import {
  ActionIcon,
  Badge,
  Flex,
  Group,
  Paper,
  parseThemeColor,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Title,
  Tooltip,
  useMantineTheme,
} from '@mantine/core';
import categories from '@/data/categories.json';

const CategoriesSummary = () => {
  const [active, setActive] = useState<undefined | number>(undefined);
  const theme = useMantineTheme();
  const data = Object.entries(categories)
    .map(([id, data]) => ({
      name: data.label,
      color: 'cyan',
      value: 400,
    }))
    .filter((category) => category.name !== 'indkomst');

  return (
    <Paper h="100%" w="100%" radius="md" p="md">
      <Flex justify="space-between">
        <Title order={3}>Fordeling</Title>
        <Tooltip label="wadadawad" withArrow>
          <ActionIcon variant="transparent" c="dimmed" size="sm">
            <IconInfoCircle />
          </ActionIcon>
        </Tooltip>
      </Flex>
      <Stack mt="xs">
        <Group m="auto">
          <DonutChart
            data={data}
            strokeWidth={5}
            withTooltip={false}
            pieProps={{
              activeIndex: active,
              activeShape: {
                fill: parseThemeColor({ color: theme.primaryColor, theme, colorScheme: 'dark' })
                  .value,
              },
              inactiveShape: {
                fill: parseThemeColor({ color: 'dark.5', theme, colorScheme: 'dark' }).value,
              },
            }}
          />
        </Group>
        <Group>
          <Table verticalSpacing={4} withRowBorders={false} highlightOnHover>
            <TableThead>
              <TableTr>
                <TableTh>Kategori</TableTh>
                <TableTh>Andel</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {data.map((row, index) => (
                <TableTr
                  key={row.name}
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(undefined)}
                >
                  <TableTd>{row.name}</TableTd>
                  <TableTd>
                    <Badge
                      variant={active === index ? 'filled' : 'light'}
                      color={active === index ? theme.primaryColor : 'gray'}
                    >
                      {row.value}%
                    </Badge>
                  </TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        </Group>
      </Stack>

      {/* <Stack justify="center">
        <Stack>
          {data.map((item) => (
            <Group w="100%" gap={0}>
              <Group w="100%" justify="space-between">
                <Text fz="xs" fw={700} tt="capitalize">
                  {item.name}
                </Text>

                <Text fz="xs" fw={700}>
                  {90}%
                </Text>
              </Group>

              <ProgressRoot w="100%" size={8} radius="xl">
                <ProgressSection value={90} />
              </ProgressRoot>
            </Group>
          ))}
        </Stack>
      </Stack> */}
    </Paper>
  );
};

export default CategoriesSummary;
