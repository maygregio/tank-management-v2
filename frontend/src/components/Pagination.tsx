'use client';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems
}: PaginationProps) {
  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;
  const startItem = totalItems ? (currentPage - 1) * itemsPerPage! + 1 : null;
  const endItem = totalItems ? Math.min(currentPage * itemsPerPage!, totalItems) : null;

  const handlePageChange = (direction: 'prev' | 'next') => {
    const newPage = direction === 'prev' ? currentPage - 1 : currentPage + 1;
    onPageChange(newPage);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        py: 2,
        px: 3,
        borderTop: '1px solid var(--color-border)',
        mt: 2
      }}
    >
      {totalItems && itemsPerPage && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Showing {startItem}–{endItem} of {totalItems}
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Page {currentPage} of {totalPages}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => handlePageChange('prev')}
            disabled={!canGoBack}
            aria-label="Previous page"
            sx={{
              color: canGoBack ? 'var(--color-accent-cyan)' : 'text.secondary',
              '&:hover': canGoBack ? { bgcolor: 'rgba(0, 229, 255, 0.1)' } : {}
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handlePageChange('next')}
            disabled={!canGoForward}
            aria-label="Next page"
            sx={{
              color: canGoForward ? 'var(--color-accent-cyan)' : 'text.secondary',
              '&:hover': canGoForward ? { bgcolor: 'rgba(0, 229, 255, 0.1)' } : {}
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
