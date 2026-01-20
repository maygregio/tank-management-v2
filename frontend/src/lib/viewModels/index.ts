/**
 * View Model Utilities
 *
 * This module contains view-model utilities for complex data transformations.
 * View-models separate business logic from UI components, making the code more
 * testable and maintainable.
 *
 * Pattern:
 * - Accept raw data (usually from React Query)
 * - Transform into UI-ready format
 * - Use useMemo for memoization
 * - Return typed objects suitable for rendering
 *
 * Example usage in movements page:
 * ```tsx
 * const viewModel = useMovementsViewModel({ movements, tanks, ... });
 * // Use viewModel.rows for DataGrid, viewModel.summaryStats for cards, etc.
 * ```
 */

export * from './tankHistory';
