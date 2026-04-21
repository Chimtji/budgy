import { useEffect, useState } from 'react';
import { Box, Table } from '@mantine/core';
import { getLabelOfCategory, getLabelOfSegment, resolveStatus } from '@/data/helpers';
import BillRow from './BillRow';
import { TBillRow, TBillsTableProps } from './BillsTable.types';
import BillsTableHead from './BillsTableHead';
import classes from './BillsTable.module.css';

const BillsTable = ({ bills, title, search }: TBillsTableProps) => {
  const [filteredData, setFilteredData] = useState<typeof bills>(bills);
  const [sortColumn, setSortColumn] = useState<keyof TBillRow>('companyName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSearch = (searchQuery: string) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      setFilteredData(bills);
      return;
    }

    const entries = Object.entries(bills).filter(([, bill]) => {
      const name = bill.name.toLowerCase();
      const companyName = bill.companyName.toLowerCase();
      const categoryLabel = getLabelOfCategory(bill.category).toLowerCase();
      const segmentLabel = getLabelOfSegment(bill.category, bill.segment).toLowerCase();

      return (
        name.includes(query) ||
        companyName.includes(query) ||
        categoryLabel.includes(query) ||
        segmentLabel.includes(query)
      );
    });

    setFilteredData(Object.fromEntries(entries));
  };

  useEffect(() => {
    handleSearch(search);
  }, [search, bills]);

  const rows: TBillRow[] = Object.entries(filteredData)
    .map(([id, bill]) => ({
      ...bill,
      status: resolveStatus(bill.category, bill.segment),
      id: parseInt(id, 10),
    }))
    .sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      let cmp = 0;

      if (sortColumn === 'due') {
        // For due column, sort by the number of payments (array length)
        const aLength = Array.isArray(aVal) ? aVal.length : 0;
        const bLength = Array.isArray(bVal) ? bVal.length : 0;
        cmp = aLength - bLength;
      } else if (Array.isArray(aVal) && Array.isArray(bVal)) {
        cmp = (aVal[0] ?? 0) - (bVal[0] ?? 0);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal), 'da');
      }

      return sortDirection === 'asc' ? cmp : -cmp;
    });

  return (
    <Box className={classes.root}>
      <Box className={classes.scrollHider} />
      <Table className={classes.table}>
        <BillsTableHead
          onSort={(column, direction) => {
            setSortColumn(column as keyof TBillRow);
            setSortDirection(direction ?? 'asc');
          }}
        />
        <Table.Tbody className={classes.body}>
          {rows.map((row) => (
            <BillRow key={row.companyName + row.amount} row={row} />
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );
};

export default BillsTable;
