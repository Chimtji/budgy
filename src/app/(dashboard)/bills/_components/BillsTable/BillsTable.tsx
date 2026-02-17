import { useEffect, useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import {
  Avatar,
  Badge,
  Box,
  Code,
  Group,
  Indicator,
  NumberFormatter,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import {
  getLabelOfCategory,
  getLabelOfSegment,
  getMonthLabels,
  resolveCadenceLabel,
  resolveStatus,
} from '@/data/helpers';
import { TBillRow, TBillsTableProps } from './BillsTable.types';
import BillsTableHead from './BillsTableHead';
import CreateBill from './CreateBill';
import EditBill from './EditBill';
import classes from './BillsTable.module.css';

const BillsTable = ({ bills, title }: TBillsTableProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 200);
  const [filteredData, setFilteredData] = useState<typeof bills>(bills);

  useEffect(() => {
    handleSearch(search);
  }, [debouncedSearch]);

  const rows: TBillRow[] = Object.entries(bills).map(([id, bill]) => ({
    ...bill,
    status: resolveStatus(bill.category, bill.segment),
    id,
  }));

  const handleSearch = (search: string) => {
    // onSearch(search).then((result) => setFilteredData(result));
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>{title}</Title>
        <Group justify="space-between">
          <Group>
            <TextInput
              radius="md"
              placeholder="Search.."
              leftSection={<IconSearch size={20} />}
              variant="filled"
              value={search}
              onChange={(event) => {
                setSearch(event.currentTarget.value);
              }}
              rightSection={<Text>{Object.keys(filteredData).length}</Text>}
              styles={{
                input: {
                  backgroundColor: `var(--mantine-color-dark-8)`,
                },
              }}
            />

            <CreateBill />
          </Group>
        </Group>
      </Group>
      <ScrollArea
        h="100%"
        onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
        className={classes.wrapper}
      >
        <Box className={classes.root}>
          <Table className={classes.table}>
            <Table.Thead className={`${classes.head} ${scrolled && classes.scrolled}`}>
              <Table.Tr>
                <BillsTableHead onSort={(column, direction) => {}} />
                <Table.Th className={classes.headItem}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody className={classes.body}>
              {rows.map((row) => (
                <Table.Tr key={row.companyName + row.amount}>
                  <Table.Td>
                    <NumberFormatter
                      value={Math.abs(row.amount)}
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={1}
                      suffix=" Kr."
                    />
                  </Table.Td>
                  <Table.Td>
                    <Group>
                      <Avatar
                        size="md"
                        src={`https://cdn.brandfetch.io/domain/${row.companyDomain}?c=${process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID}`}
                      />
                      {row.companyName}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light">{getLabelOfCategory(row.category)}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light">{getLabelOfSegment(row.category, row.segment)}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label={getMonthLabels(row.due).join(', ')}>
                      <Group>
                        {resolveCadenceLabel(row.due).map((month) => (
                          <Code key={month + row.companyName + row.amount}>{month}</Code>
                        ))}
                      </Group>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td>
                    <Indicator
                      position="middle-start"
                      processing={row.status === 'pending'}
                      color={row.status === 'added' ? 'green' : 'yellow'}
                      ml="1em"
                    >
                      <Box w="1px" h="1px" ml="lg" />
                    </Indicator>
                  </Table.Td>
                  <Table.Td>
                    <EditBill bill={row} />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      </ScrollArea>
    </Stack>
  );
};

export default BillsTable;
