import { Box, SimpleGrid, Skeleton, Stack } from '@mantine/core';
import AreasSummary from './_components/AreasSummary/AreasSummary';
import AvgBillsSpend from './_components/AvgBillsSpend/AvgBillsSpend';
import BudgetScore from './_components/BudgetScore/BudgetScore';
import CategoriesSummary from './_components/CategoriesSummary/CategoriesSummary';
import ExpenseHeatmap from './_components/ExpenseHeatmap/ExpenseHeatmap';
import FundsAllocation from './_components/FundsAllocation/FundsAllocation';
import IncomeExpenseTrend from './_components/IncomeExpenseTrend/IncomeExpenseTrend';
import KeyFigures from './_components/KeyFigures/KeyFigures';
import Notifications from './_components/Notifications/Notifications';
import styles from './page.module.css';

const PRIMARY_COL_HEIGHT = '300px';

const Overview = () => {
  return (
    <Stack w="100%" h="100vh" p="lg">
      <SimpleGrid cols={4}>
        <AreasSummary />
      </SimpleGrid>
      <Box className={styles.pageGrid}>
        <Box className={styles.subGrid}>
          <Box className={styles.topSubGrid}>
            <IncomeExpenseTrend />
          </Box>
          <Box>
            <CategoriesSummary />
          </Box>
          <Box>
            <Stack>
              <FundsAllocation />
              <BudgetScore />
              <AvgBillsSpend />
            </Stack>
          </Box>
        </Box>
        <Box className={styles.subGrid}>
          <Box>
            <ExpenseHeatmap />
          </Box>
          <Box>
            <KeyFigures />
          </Box>
          <Box>{/* <Notifications /> */}</Box>
        </Box>
      </Box>
    </Stack>
  );
};

export default Overview;
