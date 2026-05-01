import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Person as PersonIcon,
  Book as BookIcon,
  Warning as WarningIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
import {
  getBorrowingsByRenewalStatus,
  getUserById,
  getBookDataByBookCopyId,
  getTotalUnpaidPenaltiesByUserId,
} from "../api/queries";
import { approveRenewal, rejectRenewal } from "../api/mutations";
import {
  RenewalRequest,
  TabPanelProps,
  RenewalRequestStatus,
  LabelColor,
} from "../utils/interfaces";

ModuleRegistry.registerModules([AllCommunityModule]);

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const Renewals: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(1); // Default to Pending tab
  const [renewalRequests, setRenewalRequests] = useState<RenewalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RenewalRequest | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadRenewalRequests();
  }, [tabValue]);

  const loadRenewalRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      // Map tab index to renewal status
      const statusMap = [
        RenewalRequestStatus.NONE,
        RenewalRequestStatus.PENDING,
        RenewalRequestStatus.ACCEPTED,
        RenewalRequestStatus.REJECTED,
      ];
      let borrowings;

      if (tabValue === 0) {
        const [pending, accepted, rejected] = await Promise.all([
          getBorrowingsByRenewalStatus(RenewalRequestStatus.PENDING),
          getBorrowingsByRenewalStatus(RenewalRequestStatus.ACCEPTED),
          getBorrowingsByRenewalStatus(RenewalRequestStatus.REJECTED),
        ]);
        borrowings = [...pending, ...accepted, ...rejected];
      } else {
        borrowings = await getBorrowingsByRenewalStatus(statusMap[tabValue]);
      }

      // Fetch details for each borrowing
      const requestsWithDetails = await Promise.all(
        borrowings.map(async (borrowing) => {
          try {
            const [userData, bookData, penalties] = await Promise.all([
              getUserById(borrowing.userId),
              getBookDataByBookCopyId(borrowing.bookCopyId),
              getTotalUnpaidPenaltiesByUserId(borrowing.userId),
            ]);

            return {
              id: borrowing.id,
              borrowingId: borrowing.id,
              memberId: borrowing.userId,
              memberName: userData.name,
              memberUsername: userData.username,
              memberPhone: userData.phone,
              bookCopyId: borrowing.bookCopyId,
              bookTitle: bookData.title,
              bookAuthor: bookData.author?.name || "Unknown",
              bookIsbn: bookData.isbn,
              issuedDate: borrowing.issuedDate,
              currentDueDate: borrowing.dueDate,
              requestedDate: borrowing.issuedDate,
              status: borrowing.renewalStatus as
                | RenewalRequestStatus.PENDING
                | RenewalRequestStatus.ACCEPTED
                | RenewalRequestStatus.REJECTED,
              decidedDate: borrowing.decidedDate,
              penalties,
            };
          } catch (err) {
            console.error(
              `Failed to load details for borrowing ${borrowing.id}:`,
              err
            );
            return null;
          }
        })
      );

      const validRequests = requestsWithDetails.filter(
        (req) => req !== null
      ) as RenewalRequest[];

      validRequests.sort((a, b) => {
        if (a.status === "PENDING" && b.status !== "PENDING") return -1;
        if (a.status !== "PENDING" && b.status === "PENDING") return 1;
        return parseInt(b.currentDueDate) - parseInt(a.currentDueDate);
      });

      setRenewalRequests(validRequests);
    } catch (err: any) {
      setError(err.message || "Failed to load renewal requests");
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (request: RenewalRequest) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  // Handle approve action
  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      setError(null);

      await approveRenewal(selectedRequest.borrowingId);

      setModalOpen(false);
      setSelectedRequest(null);
      loadRenewalRequests();
    } catch (err: any) {
      setError(err.message || "Failed to approve renewal");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject action
  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      setError(null);

      await rejectRenewal(selectedRequest.borrowingId);

      setModalOpen(false);
      setSelectedRequest(null);
      loadRenewalRequests();
    } catch (err: any) {
      setError(err.message || "Failed to reject renewal");
    } finally {
      setActionLoading(false);
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: string): string => {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate new due date (current due date + 14 days)
  const calculateNewDueDate = (currentDueDate: string): string => {
    const currentDue = new Date(parseInt(currentDueDate));
    const newDue = new Date(currentDue);
    newDue.setDate(newDue.getDate() + 14);
    return newDue.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Cell renderer for status column
  const statusRenderer = (params: any) => {
    const status = params.value;
    const colorMap = {
      PENDING: LabelColor.WARNING,
      ACCEPTED: LabelColor.SUCCESS,
      REJECTED: LabelColor.ERROR,
    } as const;

    return (
      <Chip
        label={status}
        color={colorMap[status as keyof typeof colorMap]}
        size="small"
      />
    );
  };

  const columnDefs: ColDef[] = [
    {
      field: "borrowingId",
      headerName: "Request ID",
      width: 120,
      sortable: true,
    },
    {
      field: "memberName",
      headerName: "Member Name",
      width: 180,
      sortable: true,
      filter: true,
    },
    {
      field: "bookTitle",
      headerName: "Book Title",
      width: 250,
      sortable: true,
      filter: true,
    },
    {
      field: "currentDueDate",
      headerName: "Current Due Date",
      width: 160,
      sortable: true,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: "requestedDate",
      headerName: "Requested Date",
      width: 160,
      sortable: true,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: "status",
      headerName: "Status",
      width: 140,
      cellRenderer: statusRenderer,
      sortable: true,
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
            <RefreshIcon fontSize="large" /> Renewal Requests
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and manage member renewal requests
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadRenewalRequests}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="All" />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Pending
                {!loading && tabValue === 1 && renewalRequests.length > 0 && (
                  <Chip
                    label={renewalRequests.length}
                    size="small"
                    color="warning"
                  />
                )}
              </Box>
            }
          />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      </Paper>

      <Paper sx={{ height: 600, width: "100%" }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress size={60} />
          </Box>
        ) : renewalRequests.length === 0 ? (
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
            <RefreshIcon sx={{ fontSize: 60, color: "#ccc" }} />
            <Typography variant="h6" color="text.secondary">
              No renewal requests found
            </Typography>
          </Box>
        ) : (
          <AgGridReact
            rowData={renewalRequests}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={10}
            onRowClicked={(event) => handleRowClick(event.data)}
            domLayout="normal"
            rowStyle={{ cursor: "pointer" }}
          />
        )}
      </Paper>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedRequest && (
          <>
            <DialogTitle sx={{ bgcolor: "#1976d2", color: "white" }}>
              <Typography variant="h6">Renewal Request Details</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Request ID: #{selectedRequest.borrowingId}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Card sx={{ mb: 3, bgcolor: "#f9f9f9" }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <PersonIcon /> Member Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.memberName}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Username
                      </Typography>
                      <Typography variant="body1">
                        @{selectedRequest.memberUsername}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.memberPhone}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Unpaid Penalties
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color:
                            selectedRequest.penalties > 0
                              ? "#d32f2f"
                              : "#2e7d32",
                          fontWeight: selectedRequest.penalties > 0 ? 600 : 400,
                        }}
                      >
                        ${selectedRequest.penalties.toFixed(2)}
                        {selectedRequest.penalties > 0 && (
                          <WarningIcon
                            sx={{
                              fontSize: 16,
                              ml: 0.5,
                              verticalAlign: "middle",
                            }}
                          />
                        )}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mb: 3, bgcolor: "#f9f9f9" }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <BookIcon /> Book Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="h6">
                        {selectedRequest.bookTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        by {selectedRequest.bookAuthor}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        ISBN
                      </Typography>
                      <Typography variant="body2">
                        {selectedRequest.bookIsbn}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Copy ID
                      </Typography>
                      <Typography variant="body2">
                        {selectedRequest.bookCopyId}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mb: 3, bgcolor: "#f9f9f9" }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <ScheduleIcon /> Borrowing Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Issued Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedRequest.issuedDate)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Current Due Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedRequest.currentDueDate)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          New Due Date (if approved):
                        </Typography>
                        <Typography variant="h6" sx={{ color: "#1976d2" }}>
                          {calculateNewDueDate(selectedRequest.currentDueDate)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (Current due date + 14 days)
                        </Typography>
                      </Alert>
                    </Grid>
                    {selectedRequest.status !== "PENDING" &&
                      selectedRequest.decidedDate && (
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Decision Date
                          </Typography>
                          <Typography variant="body1">
                            {formatDate(selectedRequest.decidedDate)}
                          </Typography>
                        </Grid>
                      )}
                  </Grid>
                </CardContent>
              </Card>

              {selectedRequest.penalties > 0 &&
                selectedRequest.status === "PENDING" && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Note: This member has $
                      {selectedRequest.penalties.toFixed(2)} in unpaid
                      penalties.
                    </Typography>
                    <Typography variant="caption">
                      Consider asking them to clear penalties before approving
                      renewal.
                    </Typography>
                  </Alert>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button
                onClick={() => setModalOpen(false)}
                disabled={actionLoading}
              >
                Close
              </Button>
              {selectedRequest.status === "PENDING" && (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<RejectIcon />}
                    onClick={handleReject}
                    disabled={actionLoading}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<ApproveIcon />}
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <CircularProgress size={24} /> : "Approve"}
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Renewals;
