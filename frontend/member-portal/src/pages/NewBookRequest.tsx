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
  Grid,
} from "@mui/material";
import {
  MenuBook as BookIcon,
  Send as SendIcon,
  CheckCircle as SuccessIcon,
  Person as AuthorIcon,
} from "@mui/icons-material";
import { createNewBookRequest } from "../api/mutations";
import { CreateBookRequestInput, NewBookRequest } from "../utils/interfaces";
import { getUserId } from "../utils/auth";

const NewBookRequestPage: React.FC = () => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Ensure book title and author are not empty and open confirmation dialog
  const handleSubmitClick = () => {
    if (!title.trim()) {
      setError("Please enter the book title");
      return;
    }
    if (!author.trim()) {
      setError("Please enter the author name");
      return;
    }
    setConfirmDialogOpen(true);
  };

  // Handle confirmed book request submission
  const handleConfirmSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setConfirmDialogOpen(false);

      const userId = getUserId();
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const input: CreateBookRequestInput = {
        userId,
        title: title.trim(),
        author: author.trim(),
      };

      await createNewBookRequest(input);

      setSuccess(
        "Your book request has been submitted successfully! We will review it and notify you."
      );
      setTitle("");
      setAuthor("");
    } catch (err: any) {
      setError(err.message || "Failed to submit request. Please try again.");
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
        <BookIcon sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Request a New Book
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Can't find the book you're looking for? Let us know and we'll consider
          adding it to our collection!
        </Typography>
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
          {/* Request Form */}
          <Paper elevation={2} sx={{ p: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, color: "#11998e", mb: 3 }}
            >
              Book Information
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Book Title"
                  variant="outlined"
                  placeholder="Enter the title of the book you want to request"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                  required
                  InputProps={{
                    startAdornment: (
                      <BookIcon sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": {
                        borderColor: "#11998e",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#11998e",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#11998e",
                    },
                  }}
                  inputProps={{
                    maxLength: 200,
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  {title.length}/200 characters
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Author Name"
                  variant="outlined"
                  placeholder="Enter the author's name"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  disabled={loading}
                  required
                  InputProps={{
                    startAdornment: (
                      <AuthorIcon sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": {
                        borderColor: "#11998e",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#11998e",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#11998e",
                    },
                  }}
                  inputProps={{
                    maxLength: 100,
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  {author.length}/100 characters
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
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
                    disabled={loading || !title.trim() || !author.trim()}
                    sx={{
                      background:
                        "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, #0d7a6f 0%, #2dd164 100%)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 6px 20px rgba(17, 153, 142, 0.4)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    Submit Request
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4} lg={4}>
          {/* Information Section */}
          <Paper elevation={1} sx={{ p: 3, mt: 3, bgcolor: "#f8f9fa" }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>How it works:</strong>
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              component="ul"
              sx={{ pl: 2 }}
            >
              <li>Submit your book request with the title and author name</li>
              <li>Our library team will review your request</li>
              <li>
                We'll consider adding the book to our collection based on demand
                and availability
              </li>
              <li>
                You'll receive a notification once your request has been
                reviewed
              </li>
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
        <DialogTitle sx={{ bgcolor: "#11998e", color: "white" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BookIcon />
            <Typography variant="h6">Confirm Book Request</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Please confirm that you want to request the following book:
          </Typography>
          <Paper sx={{ p: 3, bgcolor: "#f5f5f5", mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Book Title
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {title}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Author Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {author}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
          <Alert severity="info" sx={{ mt: 2 }}>
            Your request will be reviewed by our library team. We'll notify you
            once it's been processed.
          </Alert>
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
              background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #0d7a6f 0%, #2dd164 100%)",
              },
            }}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewBookRequestPage;
