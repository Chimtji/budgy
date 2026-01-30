import { IconSortAscending, IconSortDescending } from '@tabler/icons-react';
import { Center, Group, MantineStyleProps, Table, Text, UnstyledButton } from '@mantine/core';
import classes from './Table.module.css';

type THeadProps = MantineStyleProps & {
  children: React.ReactNode;
  direction: 'asc' | 'desc';
  sorted: boolean;
  onSort: () => void;
};

const TableHead = ({ children, direction, sorted, onSort }: THeadProps) => {
  const Icon = direction === 'asc' ? IconSortAscending : IconSortDescending;

  return (
    <Table.Th className={classes.headItem}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group>
          <Text fw={sorted ? 700 : 400} fz="sm">
            {children}
          </Text>

          <Center className={classes.icon} opacity={!sorted ? 0 : 1}>
            <Icon size={16} stroke={3} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
};

export default TableHead;
