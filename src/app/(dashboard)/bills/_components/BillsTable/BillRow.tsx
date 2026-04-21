import {
  Avatar,
  Badge,
  Box,
  Group,
  Indicator,
  NumberFormatter,
  Table,
  Text,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  getLabelOfCategory,
  getLabelOfSegment,
  getMonthLabels,
  resolveStatus,
} from '@/data/helpers';
import { TBillRow } from './BillsTable.types';
import EditBill from './EditBill';

const BillRow = ({ row }: { row: TBillRow }) => {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Table.Tr key={row.companyName + row.amount} onClick={open} style={{ cursor: 'pointer' }}>
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
        <Text>{row.name}</Text>
      </Table.Td>
      <Table.Td>
        <Group>
          <Tooltip label={row.companyName}>
            <Avatar
              size="md"
              src={`https://cdn.brandfetch.io/domain/${row.companyDomain}?c=${process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID}`}
            />
          </Tooltip>
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
          <Text>{row.due.length}</Text>
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
        <EditBill bill={row} opened={opened} open={open} close={close} />
      </Table.Td>
    </Table.Tr>
  );
};

export default BillRow;
