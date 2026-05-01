import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from "@mui/material";
import {
  MenuBook as BookIcon,
  Refresh as RefreshIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  HourglassEmpty as PendingIcon,
  Check as AcceptIcon,
  Close as RejectIcon,
} from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
import { getAllNewBookRequestsByStatus } from "../api/queries";
import { updateNewBookRequestStatus } from "../api/mutations";
import { NewBookRequest, NewBookRequestStatus } from "../utils/interfaces";

ModuleRegistry.registerModules([AllCommunityModule]);

const NewBookRequestsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0); // Default to PENDING tab
  const [requests, setRequests] = useState<NewBookRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<NewBookRequest | null>(
    null
  );
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [tabValue]);

  // Load book requests based on selected tab
  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: NewBookRequest[];
      if (tabValue === 0) {
        data = await getAllNewBookRequestsByStatus(
          NewBookRequestStatus.PENDING
        );
      } else if (tabValue === 1) {
        data = await getAllNewBookRequestsByStatus(
          NewBookRequestStatus.ACCEPTED
        );
      } else {
        data = await getAllNewBookRequestsByStatus(
          NewBookRequestStatus.REJECTED
        );
      }
      setRequests(data);
    } catch (err: any) {
      setError(err.message || "Failed to load book requests");
    } finally {
      setLoading(false);
    }
  };

  // Handle accept request
  const handleAccept = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      setError(null);

      await updateNewBookRequestStatus(
        selectedRequest.id,
        NewBookRequestStatus.ACCEPTED
      );

      setSuccess(`Book request "${selectedRequest.title}" has been accepted`);
      setDetailsModalOpen(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (err: any) {
      setError(err.message || "Failed to accept request");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject request
  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      setError(null);

      await updateNewBookRequestStatus(
        selectedRequest.id,
        NewBookRequestStatus.REJECTED
      );
      setSuccess(`Book request "${selectedRequest.title}" has been rejected`);

      setDetailsModalOpen(false);
      setSelectedRequest(null);

      loadRequests();
    } catch (err: any) {
      setError(err.message || "Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  };

  // Open details modal
  const handleViewDetails = (request: NewBookRequest) => {
    setSelectedRequest(request);
    setDetailsModalOpen(true);
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Cell renderer for status column
  const StatusRenderer = (props: any) => {
    const request: NewBookRequest = props.data;
    if (request.status === NewBookRequestStatus.ACCEPTED) {
      return (
        <Chip
          label="Accepted"
          color="success"
          size="small"
          icon={<ApprovedIcon />}
        />
      );
    } else if (request.status === NewBookRequestStatus.REJECTED) {
      return (
        <Chip
          label="Rejected"
          color="error"
          size="small"
          icon={<RejectedIcon />}
        />
      );
    } else {
      return (
        <Chip
          label="Pending"
          color="warning"
          size="small"
          icon={<PendingIcon />}
        />
      );
    }
  };

  // Cell renderer for title column
  const TitleRenderer = (props: any) => {
    const request: NewBookRequest = props.data;
    const truncated =
      request.title.length > 60
        ? request.title.substring(0, 60) + "..."
        : request.title;

    return (
      <Box
        sx={{
          cursor: "pointer",
          "&:hover": { color: "#1976d2", textDecoration: "underline" },
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleViewDetails(request);
        }}
      >
        {truncated}
      </Box>
    );
  };

  const columnDefs: ColDef[] = [
    { field: "id", headerName: "ID", width: 80, sortable: true },
    {
      field: "title",
      headerName: "Book Title",
      width: 350,
      sortable: true,
      cellRenderer: TitleRenderer,
    },
    {
      field: "author",
      headerName: "Author",
      width: 200,
      sortable: true,
    },
    {
      field: "createdAt",
      headerName: "Requested Date",
      width: 180,
      sortable: true,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      sortable: true,
      cellRenderer: StatusRenderer,
    },
  ];

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: "#1976d2",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <BookIcon fontSize="large" /> New Book Requests
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and manage member book requests
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadRequests}
          disabled={loading}
          sx={{
            borderColor: "#1976d2",
            color: "#1976d2",
            "&:hover": {
              borderColor: "#0d7a6f",
              bgcolor: "rgba(17, 153, 142, 0.04)",
            },
          }}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          sx={{
            "& .MuiTab-root": {
              fontWeight: 500,
            },
            "& .Mui-selected": {
              color: "#11998e",
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#11998e",
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PendingIcon fontSize="small" />
                Pending
                {!loading && tabValue === 0 && requests.length > 0 && (
                  <Chip label={requests.length} size="small" color="warning" />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ApprovedIcon fontSize="small" />
                Accepted
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <RejectedIcon fontSize="small" />
                Rejected
              </Box>
            }
          />
        </Tabs>
      </Paper>

      <Paper sx={{ height: 600, width: "100%" }}>
        {loading && requests.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress size={60} sx={{ color: "#11998e" }} />
          </Box>
        ) : requests.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              gap: 2,
            }}
          >
            <BookIcon sx={{ fontSize: 60, color: "#ccc" }} />
            <Typography variant="h6" color="text.secondary">
              No book requests found
            </Typography>
          </Box>
        ) : (
          <AgGridReact
            rowData={requests}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[20, 50, 100]}
            domLayout="normal"
          />
        )}
      </Paper>

      <Dialog
        open={detailsModalOpen}
        onClose={() => !actionLoading && setDetailsModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#11998e", color: "white" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BookIcon />
            <Typography variant="h6">Book Request Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedRequest && (
            <Box>
              <Paper sx={{ p: 3, bgcolor: "#f5f5f5", mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Book Title
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "#11998e" }}
                    >
                      {selectedRequest.title}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Author Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedRequest.author}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Request ID
                    </Typography>
                    <Typography variant="body2">
                      #{selectedRequest.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Requested Date
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(selectedRequest.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {selectedRequest.status === "ACCEPTED" && (
                        <Chip
                          label="Accepted"
                          color="success"
                          icon={<ApprovedIcon />}
                        />
                      )}
                      {selectedRequest.status === "REJECTED" && (
                        <Chip
                          label="Rejected"
                          color="error"
                          icon={<RejectedIcon />}
                        />
                      )}
                      {selectedRequest.status === "PENDING" && (
                        <Chip
                          label="Pending"
                          color="warning"
                          icon={<PendingIcon />}
                        />
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDetailsModalOpen(false)}
            disabled={actionLoading}
          >
            Close
          </Button>
          {selectedRequest && selectedRequest.status === "PENDING" && (
            <>
              <Button
                variant="contained"
                color="error"
                startIcon={
                  actionLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <RejectIcon />
                  )
                }
                onClick={handleReject}
                disabled={actionLoading}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                startIcon={
                  actionLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <AcceptIcon />
                  )
                }
                onClick={handleAccept}
                disabled={actionLoading}
                sx={{
                  background:
                    "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #0d7a6f 0%, #2dd164 100%)",
                  },
                }}
              >
                Accept
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewBookRequestsPage;
