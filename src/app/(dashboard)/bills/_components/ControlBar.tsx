'use client';

import { IconCalendarWeek, IconList, IconSearch } from '@tabler/icons-react';
import { Group, SegmentedControl, TextInput } from '@mantine/core';
import CreateBill from './BillsTable/CreateBill';

type ControlBarProps = {
  viewMode: 'list' | 'calendar';
  onViewModeChange: (mode: 'list' | 'calendar') => void;
  search: string;
  onSearchChange: (value: string) => void;
};

const ControlBar = ({ viewMode, onViewModeChange, search, onSearchChange }: ControlBarProps) => {
  return (
    <Group>
      <SegmentedControl
        value={viewMode}
        size="lg"
        styles={{
          root: {
            backgroundColor: `var(--mantine-color-dark-7)`,
          },
        }}
        onChange={(value) => onViewModeChange(value as 'list' | 'calendar')}
        data={[
          {
            value: 'list',
            label: (
              <Group gap={8} wrap="nowrap">
                <IconList size={16} />
              </Group>
            ),
          },
          {
            value: 'calendar',
            label: (
              <Group gap={8} wrap="nowrap">
                <IconCalendarWeek size={16} />
              </Group>
            ),
          },
        ]}
      />
      <TextInput
        radius="md"
        placeholder="Søg.."
        leftSection={<IconSearch size={20} />}
        variant="filled"
        value={search}
        onChange={(event) => onSearchChange(event.currentTarget.value)}
        styles={{
          input: {
            backgroundColor: `var(--mantine-color-dark-7)`,
          },
        }}
      />
      <CreateBill />
    </Group>
  );
};

export default ControlBar;
