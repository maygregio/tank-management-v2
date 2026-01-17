'use client';

import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({ rows = 5, columns = 6 }: TableSkeletonProps) {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            display: 'flex',
            gap: 1,
            py: 1.5,
            px: 1,
            bgcolor: rowIndex % 2 === 0 ? 'rgba(0, 229, 255, 0.02)' : 'transparent',
            borderBottom: '1px solid rgba(0, 229, 255, 0.08)',
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              width={colIndex === 0 ? 100 : colIndex % 2 === 0 ? 80 : 120}
              height={16}
              sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.05)' }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}
