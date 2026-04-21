import { useEffect, useState, type ReactNode } from 'react';
import { IconSortAscending, IconSortDescending } from '@tabler/icons-react';
import { Center, Group, MantineStyleProps, rem, Table, Text, UnstyledButton } from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import { TBillRow } from './BillsTable.types';
import classes from './BillsTable.module.css';

type THeadProps = MantineStyleProps & {
  onSort: (sortColumn: string, sortDirection: TTableHeadProps['direction']) => void;
};

type TTableHeadProps = {
  children?: ReactNode;
  direction?: 'asc' | 'desc';
  sorted?: boolean;
  onSort?: () => void;
  w?: string;
  mw?: string;
};

const BillsTableHead = ({ onSort }: THeadProps) => {
  const [sortColumn, setSortColumn] = useState<keyof TBillRow>('companyName');
  const [sortDirection, toggleSortDirection] = useToggle<'asc' | 'desc'>(['asc', 'desc']);

  const handleSort = (column: keyof TBillRow) => {
    setSortColumn(column);

    if (sortColumn === column) {
      toggleSortDirection();
    }
  };

  useEffect(() => {
    onSort?.(sortColumn, sortDirection);
  }, [sortColumn, sortDirection]);

  const TableHead = ({ children, sorted, direction, onSort, w, mw = '50px' }: TTableHeadProps) => {
    const Icon = direction === 'asc' ? IconSortAscending : IconSortDescending;

    return (
      <Table.Th className={classes.headItem} w={w} miw={rem(mw)}>
        <UnstyledButton onClick={onSort} className={classes.control}>
          <Group>
            <Text fw={sorted ? 700 : 400} fz="sm">
              {children}
            </Text>

            {/* <Center className={classes.icon} opacity={!sorted ? 0 : 1}>
              <Icon size={16} stroke={3} />
            </Center> */}
          </Group>
        </UnstyledButton>
      </Table.Th>
    );
  };

  return (
    <Table.Thead className={`${classes.head}`}>
      <Table.Tr>
        <TableHead
          sorted={sortColumn === 'amount'}
          direction={sortDirection}
          onSort={() => handleSort('amount')}
          mw={'120px'}
        >
          Beløb
        </TableHead>
        <TableHead
          sorted={sortColumn === 'name'}
          direction={sortDirection}
          onSort={() => handleSort('name')}
        >
          Navn
        </TableHead>
        <TableHead
          sorted={sortColumn === 'companyName'}
          direction={sortDirection}
          onSort={() => handleSort('companyName')}
        >
          Modtager
        </TableHead>
        <TableHead
          sorted={sortColumn === 'category'}
          direction={sortDirection}
          onSort={() => handleSort('category')}
        >
          Kategori
        </TableHead>
        <TableHead
          sorted={sortColumn === 'segment'}
          direction={sortDirection}
          onSort={() => handleSort('segment')}
        >
          Segment
        </TableHead>
        <TableHead
          sorted={sortColumn === 'due'}
          direction={sortDirection}
          onSort={() => handleSort('due')}
        >
          Betalinger
        </TableHead>
        <TableHead
          sorted={sortColumn === 'status'}
          direction={sortDirection}
          onSort={() => handleSort('status')}
        >
          Status
        </TableHead>
        <Table.Th className={classes.headItem}></Table.Th>
      </Table.Tr>
    </Table.Thead>
  );
};

export default BillsTableHead;
