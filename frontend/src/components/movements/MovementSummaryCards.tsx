import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { styles } from '@/lib/constants';
import type { MovementSummaryStats } from '@/lib/types';

interface MovementSummaryCardsProps {
  summaryStats: MovementSummaryStats;
}

export default function MovementSummaryCards({ summaryStats }: MovementSummaryCardsProps) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
      {[
        { label: 'Scheduled Today', value: summaryStats.scheduledToday },
        { label: 'Pending', value: summaryStats.pending },
        { label: 'Completed', value: summaryStats.completed },
        { label: 'Total', value: summaryStats.total },
      ].map((stat) => (
        <Box key={stat.label} sx={styles.summaryCard}>
          <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.2em', fontSize: '0.6rem' }}>
            {stat.label.toUpperCase()}
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-accent-cyan)' }}>
            {stat.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
