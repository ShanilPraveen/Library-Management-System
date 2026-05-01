import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Grid,
} from "@mui/material";
import {
  Feedback as FeedbackIcon,
  Send as SendIcon,
  Lock as AnonymousIcon,
  CheckCircle as SuccessIcon,
} from "@mui/icons-material";
import { createFeedback } from "../api/mutations";

const FeedbackPage: React.FC = () => {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Ensure feedback is not empty and open confirmation dialog
  const handleSubmitClick = () => {
    if (!feedback.trim()) {
      setError("Please enter your feedback before submitting");
      return;
    }
    setConfirmDialogOpen(true);
  };

  // Handle confirmed feedback submission
  const handleConfirmSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setConfirmDialogOpen(false);

      await createFeedback({ content: feedback });

      setSuccess("Thank you! Your feedback has been submitted successfully.");
      setFeedback("");
    } catch (err: any) {
      setError(err.message || "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mx: "auto", p: 3 }}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          textAlign: "center",
        }}
      >
        <FeedbackIcon sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          We Value Your Feedback
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95, mb: 2 }}>
          Help us improve our library services. Share your thoughts,
          suggestions, or concerns.
        </Typography>
        <Chip
          icon={<AnonymousIcon />}
          label="100% Anonymous - Your identity is protected"
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.2)",
            color: "white",
            fontWeight: 500,
            backdropFilter: "blur(10px)",
          }}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          icon={<SuccessIcon />}
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8} lg={8}>
          {/* Feedback Form */}
          <Paper elevation={2} sx={{ p: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, color: "#667eea", mb: 3 }}
            >
              Share Your Thoughts
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={8}
              variant="outlined"
              placeholder="What do you think about our library services? Share your experiences, suggestions, or any concerns you may have..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={loading}
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "#667eea",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#667eea",
                  },
                },
              }}
              inputProps={{
                maxLength: 1000,
              }}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {feedback.length}/1000 characters
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SendIcon />
                  )
                }
                onClick={handleSubmitClick}
                disabled={loading || !feedback.trim()}
                sx={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #5568d3 0%, #63358a 100%)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Submit Feedback
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4} lg={4}>
          {/* Information Section */}
          <Paper elevation={1} sx={{ p: 3, mt: 3, bgcolor: "#f8f9fa" }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Why your feedback matters:</strong>
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              component="ul"
              sx={{ pl: 2 }}
            >
              <li>Help us understand your needs better</li>
              <li>Improve our services and facilities</li>
              <li>Shape the future of our library</li>
              <li>Your voice is completely anonymous and confidential</li>
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#667eea", color: "white" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FeedbackIcon />
            <Typography variant="h6">Confirm Feedback Submission</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Alert severity="info" icon={<AnonymousIcon />} sx={{ mb: 2 }}>
            This feedback will be submitted anonymously. Your identity will not
            be shared.
          </Alert>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Your feedback:</strong>
          </Typography>
          <Paper
            sx={{ p: 2, bgcolor: "#f5f5f5", maxHeight: 200, overflow: "auto" }}
          >
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {feedback}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #63358a 100%)",
              },
            }}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FeedbackPage;
