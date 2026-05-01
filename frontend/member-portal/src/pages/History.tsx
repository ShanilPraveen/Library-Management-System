import React, { useState, useEffect } from "react";
import { Box, Typography, Alert, CircularProgress, Chip } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-material.css";
import {
  getAllBorrowingsByUserId,
  getBookDataByBookCopyId,
} from "../api/queries";
import { getUserId } from "../utils/auth";
import { Borrowing, Size, LabelType, LabelColor } from "../utils/interfaces";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function History() {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = getUserId();

      // Get all borrowings from circulation service
      const borrowingsData = await getAllBorrowingsByUserId(userId);

      // For each borrowing, fetch the book data from catalog service
      const borrowingsWithBookData = await Promise.all(
        borrowingsData.map(async (borrowing) => {
          try {
            const bookData = await getBookDataByBookCopyId(
              borrowing.bookCopyId
            );
            // Merge the book data
            return {
              ...borrowing,
              book: bookData,
            };
          } catch (err) {
            console.error(
              `Failed to load book data for borrowing ${borrowing.id}:`,
              err
            );
            return borrowing;
          }
        })
      );

      setBorrowings(borrowingsWithBookData);
    } catch (err: any) {
      setError(err.message || "Failed to load borrowing history");
    } finally {
      setLoading(false);
    }
  };

  // Cell renderer for borrowing status column
  const statusRenderer = (params: any) => {
    const borrowing: Borrowing = params.data;
    const now = new Date();
    const dueDate = new Date(parseInt(borrowing.dueDate));

    if (borrowing.receivedDate) {
      return (
        <Chip
          label={LabelType.RETURNED}
          size={Size.SMALL}
          color={LabelColor.SUCCESS}
        />
      );
    }

    if (dueDate < now) {
      return (
        <Chip
          label={LabelType.OVERDUE}
          size={Size.SMALL}
          color={LabelColor.ERROR}
        />
      );
    }

    return (
      <Chip
        label={LabelType.ACTIVE}
        size={Size.SMALL}
        color={LabelColor.PRIMARY}
      />
    );
  };

  // Cell renderer for renewal status column
  const renewalStatusRenderer = (params: any) => {
    const status = params.value;

    if (status === "NONE") return "-";

    const colorMap: Record<string, LabelColor> = {
      PENDING: LabelColor.WARNING,
      ACCEPTED: LabelColor.SUCCESS,
      REJECTED: LabelColor.ERROR,
    };

    return (
      <Chip
        label={status}
        size={Size.SMALL}
        color={colorMap[status] || LabelColor.DEFAULT}
      />
    );
  };

  const dateFormatter = (params: any) => {
    if (!params.value) return "-";
    return new Date(parseInt(params.value)).toLocaleDateString();
  };

  // Column definitions
  const columnDefs: ColDef[] = [
    {
      headerName: "Book Title",
      field: "book.title",
      flex: 2,
      filter: "agTextColumnFilter",
      sortable: true,
    },
    {
      headerName: "Author",
      field: "book.author.name",
      flex: 1.5,
      filter: "agTextColumnFilter",
      sortable: true,
    },
    {
      headerName: "Borrowed Date",
      field: "issuedDate",
      flex: 1,
      valueFormatter: dateFormatter,
      sortable: true,
    },
    {
      headerName: "Due Date",
      field: "dueDate",
      flex: 1,
      valueFormatter: dateFormatter,
      sortable: true,
    },
    {
      headerName: "Returned Date",
      field: "receivedDate",
      flex: 1,
      valueFormatter: dateFormatter,
      sortable: true,
    },
    {
      headerName: "Status",
      flex: 1,
      cellRenderer: statusRenderer,
      filter: false,
    },
    {
      headerName: "Renewal",
      field: "renewalStatus",
      flex: 1,
      cellRenderer: renewalStatusRenderer,
      filter: true,
    },
  ];

  // Grid default settings
  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Borrowing History
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        View all your past and current book borrowings
      </Typography>

      <Box display="flex" gap={2} mb={3}>
        <Chip
          label={`Total: ${borrowings.length}`}
          color="primary"
          variant="outlined"
        />
        <Chip
          label={`Active: ${borrowings.filter((b) => !b.receivedDate).length}`}
          color="primary"
        />
        <Chip
          label={`Returned: ${borrowings.filter((b) => b.receivedDate).length}`}
          color="success"
        />
      </Box>

      {borrowings.length === 0 ? (
        <Alert severity="info">No borrowing history found</Alert>
      ) : (
        <Box
          className="ag-theme-material"
          sx={{
            height: 600,
            width: "100%",
            backgroundColor: "#bf4141ff",
            borderRadius: 1,
            boxShadow: 1,
            "& .ag-header-cell-label": {
              fontWeight: 600,
              textAlign: "center",
            },
          }}
        >
          <AgGridReact
            rowData={borrowings}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={20}
            enableBrowserTooltips={true}
            animateRows={true}
            enableCellTextSelection={true}
            ensureDomOrder={true}
            headerHeight={52}
            rowHeight={48}
            getRowId={(params) => params.data.id.toString()}
          />
        </Box>
      )}
    </Box>
  );
}
