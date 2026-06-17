import { useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';

/** Adapt v6-style column callbacks (params object) to MUI DataGrid v7 signatures. */
const adaptColumns = (columns) =>
  columns.map((col) => {
    const next = { ...col };

    if (typeof col.valueGetter === 'function') {
      const legacyGetter = col.valueGetter;
      next.valueGetter = (value, row, column, apiRef) =>
        legacyGetter({ row, value, field: col.field, colDef: column, api: apiRef });
    }

    if (typeof col.valueFormatter === 'function') {
      const legacyFormatter = col.valueFormatter;
      next.valueFormatter = (value, row, column, apiRef) =>
        legacyFormatter({ value, row, field: col.field, colDef: column, api: apiRef });
    }

    return next;
  });

export default function DataTable({ rows, columns, loading, pageSize = 10, ...props }) {
  const gridColumns = useMemo(() => adaptColumns(columns), [columns]);

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2 }}>
      <DataGrid
        rows={rows}
        columns={gridColumns}
        loading={loading}
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize } } }}
        disableRowSelectionOnClick
        autoHeight
        sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }}
        {...props}
      />
    </Box>
  );
}
