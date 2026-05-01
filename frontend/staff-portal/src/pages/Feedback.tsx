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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Feedback as FeedbackIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as ViewedIcon,
  Warning as UnviewedIcon,
} from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
import {
  getAllFeedbacks,
  getAllViewedFeedbacks,
  getAllUnviewedFeedbacks,
} from "../api/queries";
import { markFeedbackAsViewedById, deleteFeedbackById } from "../api/mutations";
import { Feedback } from "../utils/interfaces";
import { feedbackLengthLimit } from "../utils/constants";

ModuleRegistry.registerModules([AllCommunityModule]);

const FeedbackPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(1); // Default to Unviewed tab
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [viewContentModalOpen, setViewContentModalOpen] = useState(false);

  useEffect(() => {
    loadFeedbacks();
  }, [tabValue]);

  // Load feedbacks based on selected tab
  const loadFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: Feedback[];
      if (tabValue === 0) {
        data = await getAllFeedbacks();
      } else if (tabValue === 1) {
        data = await getAllUnviewedFeedbacks();
      } else {
        data = await getAllViewedFeedbacks();
      }
      setFeedbacks(data);
    } catch (err: any) {
      setError(err.message || "Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  };

  // Mark feedback as viewed
  const handleMarkAsViewed = async (feedback: Feedback) => {
    try {
      setLoading(true);
      setError(null);

      await markFeedbackAsViewedById(feedback.id);

      setSuccess("Feedback marked as viewed");
      loadFeedbacks();
    } catch (err: any) {
      setError(err.message || "Failed to mark feedback as viewed");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete feedback
  const handleDeleteClick = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedFeedback) return;

    try {
      setLoading(true);
      setError(null);

      await deleteFeedbackById(selectedFeedback.id);

      setSuccess("Feedback deleted successfully");
      setDeleteConfirmOpen(false);
      setSelectedFeedback(null);
      loadFeedbacks();
    } catch (err: any) {
      setError(err.message || "Failed to delete feedback");
      setDeleteConfirmOpen(false);
      setSelectedFeedback(null);
    } finally {
      setLoading(false);
    }
  };

  // View feedback content
  const handleViewContent = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setViewContentModalOpen(true);
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

  // Feedbacks Table
  const StatusRenderer = (props: any) => {
    const feedback: Feedback = props.data;
    return feedback.isViewed ? (
      <Chip label="Viewed" color="success" size="small" icon={<ViewedIcon />} />
    ) : (
      <Chip
        label="Unviewed"
        color="warning"
        size="small"
        icon={<UnviewedIcon />}
      />
    );
  };

  const ContentRenderer = (props: any) => {
    const feedback: Feedback = props.data;
    const truncated =
      feedback.content.length > feedbackLengthLimit
        ? feedback.content.substring(0, feedbackLengthLimit) + "..."
        : feedback.content;

    return (
      <Box
        sx={{ cursor: "pointer", "&:hover": { color: "#1976d2" } }}
        onClick={(e) => {
          e.stopPropagation();
          handleViewContent(feedback);
        }}
      >
        {truncated}
      </Box>
    );
  };

  const ActionsRenderer = (props: any) => {
    const feedback: Feedback = props.data;
    return (
      <Box sx={{ display: "flex", gap: 1 }}>
        {!feedback.isViewed && (
          <Tooltip title="Mark as Viewed">
            <IconButton
              size="small"
              color="success"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsViewed(feedback);
              }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Delete Feedback">
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(feedback);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  const columnDefs: ColDef[] = [
    { field: "id", headerName: "ID", width: 80, sortable: true },
    {
      field: "content",
      headerName: "Content",
      width: 500,
      sortable: true,
      cellRenderer: ContentRenderer,
    },
    {
      field: "createdAt",
      headerName: "Created Date",
      width: 180,
      sortable: true,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: "isViewed",
      headerName: "Status",
      width: 130,
      sortable: true,
      cellRenderer: StatusRenderer,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      cellRenderer: ActionsRenderer,
      sortable: false,
      filter: false,
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
            <FeedbackIcon fontSize="large" /> Feedback Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage member feedback 
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadFeedbacks}
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
        >
          <Tab label="All" />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Unviewed
                {!loading && tabValue === 1 && feedbacks.length > 0 && (
                  <Chip label={feedbacks.length} size="small" color="warning" />
                )}
              </Box>
            }
          />
          <Tab label="Viewed" />
        </Tabs>
      </Paper>

      <Paper sx={{ height: 600, width: "100%" }}>
        {loading && feedbacks.length === 0 ? (
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
        ) : feedbacks.length === 0 ? (
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
            <FeedbackIcon sx={{ fontSize: 60, color: "#ccc" }} />
            <Typography variant="h6" color="text.secondary">
              No feedbacks found
            </Typography>
          </Box>
        ) : (
          <AgGridReact
            rowData={feedbacks}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={15}
            domLayout="normal"
          />
        )}
      </Paper>

      <Dialog
        open={viewContentModalOpen}
        onClose={() => setViewContentModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#1976d2", color: "white" }}>
          <Typography variant="h6">Feedback Details</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedFeedback && (
            <Box>
              <Paper sx={{ p: 3, bgcolor: "#f5f5f5", mb: 2 }}>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {selectedFeedback.content}
                </Typography>
              </Paper>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Submitted: {formatDate(selectedFeedback.createdAt)}
                </Typography>
                {selectedFeedback.isViewed ? (
                  <Chip
                    label="Viewed"
                    color="success"
                    size="small"
                    icon={<ViewedIcon />}
                  />
                ) : (
                  <Chip
                    label="Unviewed"
                    color="warning"
                    size="small"
                    icon={<UnviewedIcon />}
                  />
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {selectedFeedback && !selectedFeedback.isViewed && (
            <Button
              variant="contained"
              color="success"
              startIcon={<ViewIcon />}
              onClick={() => {
                handleMarkAsViewed(selectedFeedback);
                setViewContentModalOpen(false);
              }}
            >
              Mark as Viewed
            </Button>
          )}
          <Button onClick={() => setViewContentModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this feedback?
          </Typography>
          {selectedFeedback && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: "#f5f5f5" }}>
              <Typography variant="body2" color="text.secondary">
                {selectedFeedback.content.substring(0, 150)}
                {selectedFeedback.content.length > 150 && "..."}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FeedbackPage;
