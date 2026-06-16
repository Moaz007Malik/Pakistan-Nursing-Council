import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';

export default function DataTable({ rows, columns, loading, pageSize = 10, ...props }) {
  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2 }}>
      <DataGrid
        rows={rows}
        columns={columns}
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
