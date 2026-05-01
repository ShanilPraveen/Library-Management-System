import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  InputAdornment,
  IconButton,
  List,
  TextField,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Book as BookIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Login as CheckInIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import {
  searchUsersByName,
  getActiveBorrowingsByUserId,
  getTotalUnpaidPenaltiesByUserId,
  getAllUnpaidPenaltiesByUserId,
  getBookDataByBookCopyId,
} from "../api/queries";
import { checkinBooks, markAllPenaltiesAsPaid } from "../api/mutations";
import {
  Borrowingin,
  Penalty,
  ReturnDetails,
  Userin,
} from "../utils/interfaces";
import { DefaultZero, miliSecondsInDay } from "../utils/constants";

const steps = [
  "Search Member",
  "View Active Borrowings",
  "Select Books",
  "Return Details",
  "Confirmation",
];

const Checkin: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Userin[]>([]);
  const [selectedUser, setSelectedUser] = useState<Userin | null>(null);

  const [activeBorrowings, setActiveBorrowings] = useState<Borrowingin[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [totalPenalties, setTotalPenalties] = useState(0);

  const [selectedBorrowings, setSelectedBorrowings] = useState<number[]>([]);

  const [returnDetails, setReturnDetails] = useState<ReturnDetails[]>([]);
  const [checkinSuccess, setCheckinSuccess] = useState(false);

  // Handle user search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a name or username");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const results = await searchUsersByName(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setError("No members found matching your search");
      }
    } catch (err: any) {
      setError(err.message || "Failed to search members");
    } finally {
      setLoading(false);
    }
  };

  // Get the selected user's borrowings and penalties
  const handleSelectUser = async (user: Userin) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery("");

    try {
      setLoading(true);
      setError(null);

      // Fetch borrowings and penalties
      const [borrowings, penaltyTotal, penaltyList] = await Promise.all([
        getActiveBorrowingsByUserId(user.id),
        getTotalUnpaidPenaltiesByUserId(user.id),
        getAllUnpaidPenaltiesByUserId(user.id),
      ]);

      // Fetch book data for each borrowing
      const borrowingsWithBooks = await Promise.all(
        borrowings.map(async (borrowing) => {
          try {
            const bookData = await getBookDataByBookCopyId(
              borrowing.bookCopyId
            );
            return {
              ...borrowing,
              book: bookData,
            };
          } catch (err) {
            console.error(`Failed to load book data:`, err);
            return borrowing;
          }
        })
      );

      setActiveBorrowings(borrowingsWithBooks);
      setTotalPenalties(penaltyTotal);
      setPenalties(penaltyList);

      setActiveStep(1);
    } catch (err: any) {
      setError(err.message || "Failed to load borrowing data");
    } finally {
      setLoading(false);
    }
  };

  // Mark all penalties as paid
  const handleMarkAllPenaltiesAsPaid = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      setError(null);

      await markAllPenaltiesAsPaid(selectedUser.id);

      const [penaltyTotal, penaltyList] = await Promise.all([
        getTotalUnpaidPenaltiesByUserId(selectedUser.id),
        getAllUnpaidPenaltiesByUserId(selectedUser.id),
      ]);

      setTotalPenalties(penaltyTotal);
      setPenalties(penaltyList);
    } catch (err: any) {
      setError(err.message || "Failed to mark penalties as paid");
    } finally {
      setLoading(false);
    }
  };

  // Handle borrowing selection/deselection
  const handleBorrowingSelection = (borrowingId: number) => {
    setSelectedBorrowings((prev) => {
      if (prev.includes(borrowingId)) {
        return prev.filter((id) => id !== borrowingId);
      } else if (prev.length < 2) {
        return [...prev, borrowingId];
      }
      return prev;
    });
  };

  // Proceed to return details step
  const handleProceedToReturnDetails = () => {
    if (selectedBorrowings.length === 0) {
      setError("Please select at least one book to return");
      return;
    }

    const details = selectedBorrowings.map((borrowingId) => {
      const borrowing = activeBorrowings.find((b) => b.id === borrowingId)!;
      return {
        borrowingId,
        bookCopyId: borrowing.bookCopyId,
        isDamaged: false,
        damageAmount: 0,
      };
    });

    setReturnDetails(details);
    setActiveStep(3);
  };

  // Update return detail for a borrowing
  const updateReturnDetail = (
    borrowingId: number,
    field: keyof ReturnDetails,
    value: any
  ) => {
    setReturnDetails((prev) =>
      prev.map((detail) =>
        detail.borrowingId === borrowingId
          ? { ...detail, [field]: value }
          : detail
      )
    );
  };

  // Handle book check-in process
  const handleCheckin = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      setError(null);

      await checkinBooks(returnDetails);

      setCheckinSuccess(true);
      setActiveStep(4);
    } catch (err: any) {
      setError(err.message || "Failed to check-in books");
    } finally {
      setLoading(false);
    }
  };

  // Reset the entire check-in process
  const handleReset = () => {
    setActiveStep(0);
    setSelectedUser(null);
    setSearchQuery("");
    setSearchResults([]);
    setActiveBorrowings([]);
    setPenalties([]);
    setTotalPenalties(0);
    setSelectedBorrowings([]);
    setReturnDetails([]);
    setCheckinSuccess(false);
    setError(null);
  };

  const calculateDaysOverdue = (dueDate: string): number => {
    const due = new Date(parseInt(dueDate));
    const now = new Date();
    const diffMs = now.getTime() - due.getTime();
    const diffDays = Math.floor(diffMs / miliSecondsInDay);
    return diffDays > DefaultZero ? diffDays : DefaultZero;
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
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
          <CheckInIcon fontSize="large" /> Check-in Books
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Process book returns with penalty handling
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 4, minHeight: "400px" }}>
        {activeStep === 0 && (
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mb: 3 }}
            >
              Search for a Member
            </Typography>

            <TextField
              fullWidth
              label="Search by Name or Username"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch} disabled={loading}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {searchResults.length > 0 && (
              <List>
                {searchResults.map((user) => (
                  <Card
                    key={user.id}
                    sx={{
                      mb: 2,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                    onClick={() => handleSelectUser(user)}
                  >
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item>
                          <Avatar
                            sx={{ bgcolor: "#1976d2", width: 56, height: 56 }}
                          >
                            <PersonIcon fontSize="large" />
                          </Avatar>
                        </Grid>
                        <Grid item xs>
                          <Typography variant="h6">{user.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            @{user.username} • {user.phone}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.address}
                          </Typography>
                        </Grid>
                        <Grid item>
                          <Button
                            variant="contained"
                            endIcon={<ArrowForwardIcon />}
                          >
                            Select
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </List>
            )}
          </Box>
        )}

        {activeStep === 1 && selectedUser && (
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mb: 3 }}
            >
              Active Borrowings & Penalties
            </Typography>

            <Card sx={{ mb: 3, bgcolor: "#f9f9f9" }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item>
                    <Avatar sx={{ bgcolor: "#1976d2", width: 64, height: 64 }}>
                      {selectedUser.name.charAt(0)}
                    </Avatar>
                  </Grid>
                  <Grid item xs>
                    <Typography variant="h5">{selectedUser.name}</Typography>
                    <Typography variant="body1" color="text.secondary">
                      @{selectedUser.username}
                    </Typography>
                    <Chip
                      label={`${activeBorrowings.length} Active Borrowing${
                        activeBorrowings.length !== 1 ? "s" : ""
                      }`}
                      color="primary"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {totalPenalties > 0 && (
              <Alert
                severity="warning"
                sx={{ mb: 3 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleMarkAllPenaltiesAsPaid}
                  >
                    Mark All as Paid
                  </Button>
                }
              >
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Total Unpaid Penalties: Rs {totalPenalties.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  {penalties.length} unpaid penalty record(s). Books cannot be
                  returned until penalties are paid.
                </Typography>
              </Alert>
            )}

            {activeBorrowings.length === 0 ? (
              <Alert severity="info">
                No active borrowings found for this member.
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#1976d2" }}>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>
                        Copy ID
                      </TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>
                        Book Title
                      </TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>
                        Author
                      </TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>
                        Issued Date
                      </TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>
                        Due Date
                      </TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeBorrowings.map((borrowing) => {
                      const daysOverdue = calculateDaysOverdue(
                        borrowing.dueDate
                      );
                      return (
                        <TableRow key={borrowing.id}>
                          <TableCell>{borrowing.bookCopyId}</TableCell>
                          <TableCell>
                            {borrowing.book?.title || "N/A"}
                          </TableCell>
                          <TableCell>
                            {borrowing.book?.author?.name || "N/A"}
                          </TableCell>
                          <TableCell>
                            {formatDate(borrowing.issuedDate)}
                          </TableCell>
                          <TableCell>{formatDate(borrowing.dueDate)}</TableCell>
                          <TableCell>
                            {daysOverdue > 0 ? (
                              <Chip
                                label={`${daysOverdue} days overdue`}
                                color="error"
                                size="small"
                              />
                            ) : (
                              <Chip
                                label="Active"
                                color="success"
                                size="small"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
                mt: 3,
              }}
            >
              <Button
                onClick={() => setActiveStep(0)}
                startIcon={<ArrowBackIcon />}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={() => setActiveStep(2)}
                disabled={activeBorrowings.length === 0 || totalPenalties > 0}
                endIcon={<ArrowForwardIcon />}
              >
                Proceed to Select Books
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mb: 3 }}
            >
              Select Books to Return
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Select up to 2 books to return at once. Click on a card to
              select/deselect.
            </Alert>

            <Grid container spacing={2}>
              {activeBorrowings.map((borrowing) => {
                const isSelected = selectedBorrowings.includes(borrowing.id);
                const daysOverdue = calculateDaysOverdue(borrowing.dueDate);

                return (
                  <Grid item xs={12} md={6} key={borrowing.id}>
                    <Card
                      sx={{
                        cursor: "pointer",
                        border: "2px solid",
                        borderColor: isSelected ? "#1976d2" : "transparent",
                        bgcolor: isSelected ? "#e3f2fd" : "white",
                        "&:hover": {
                          borderColor: "#1976d2",
                          boxShadow: 3,
                        },
                      }}
                      onClick={() => handleBorrowingSelection(borrowing.id)}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 2,
                          }}
                        >
                          <Avatar
                            sx={{ bgcolor: isSelected ? "#1976d2" : "#9e9e9e" }}
                          >
                            {isSelected ? <CheckIcon /> : <BookIcon />}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6">
                              {borrowing.book?.title || "N/A"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              by {borrowing.book?.author?.name || "N/A"}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Copy ID
                            </Typography>
                            <Typography variant="body2">
                              {borrowing.bookCopyId}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Due Date
                            </Typography>
                            <Typography variant="body2">
                              {formatDate(borrowing.dueDate)}
                            </Typography>
                          </Grid>
                        </Grid>
                        {daysOverdue > 0 && (
                          <Alert severity="error" sx={{ mt: 2, p: 1 }}>
                            {daysOverdue} days overdue
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Selected: {selectedBorrowings.length} / 2 books
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
                mt: 3,
              }}
            >
              <Button
                onClick={() => setActiveStep(1)}
                startIcon={<ArrowBackIcon />}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleProceedToReturnDetails}
                disabled={selectedBorrowings.length === 0}
                endIcon={<ArrowForwardIcon />}
              >
                Proceed to Return Details
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 3 && (
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mb: 3 }}
            >
              Return Details
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              For each book, specify if it's damaged and enter the damage amount
              if applicable.
            </Alert>

            {returnDetails.map((detail, index) => {
              const borrowing = activeBorrowings.find(
                (b) => b.id === detail.borrowingId
              )!;
              return (
                <Card key={detail.borrowingId} sx={{ mb: 3 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Typography variant="h6" gutterBottom>
                          {borrowing.book?.title || "N/A"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          by {borrowing.book?.author?.name || "N/A"}
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Copy ID
                            </Typography>
                            <Typography variant="body2">
                              {detail.bookCopyId}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Issued Date
                            </Typography>
                            <Typography variant="body2">
                              {formatDate(borrowing.issuedDate)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Due Date
                            </Typography>
                            <Typography variant="body2">
                              {formatDate(borrowing.dueDate)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Box
                          sx={{
                            border: "1px solid #e0e0e0",
                            borderRadius: 1,
                            p: 2,
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={detail.isDamaged}
                                onChange={(e) =>
                                  updateReturnDetail(
                                    detail.borrowingId,
                                    "isDamaged",
                                    e.target.checked
                                  )
                                }
                              />
                            }
                            label="Mark as Damaged"
                          />
                          {detail.isDamaged && (
                            <TextField
                              fullWidth
                              type="number"
                              label="Damage Amount (Rs)"
                              value={detail.damageAmount}
                              onChange={(e) =>
                                updateReturnDetail(
                                  detail.borrowingId,
                                  "damageAmount",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    Rs
                                  </InputAdornment>
                                ),
                              }}
                              sx={{ mt: 2 }}
                            />
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                onClick={() => setActiveStep(2)}
                startIcon={<ArrowBackIcon />}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleCheckin}
                disabled={loading}
                endIcon={<CheckIcon />}
                sx={{ minWidth: 150 }}
              >
                {loading ? <CircularProgress size={24} /> : "Complete Check-in"}
              </Button>
            </Box>
          </Box>
        )}

        {checkinSuccess && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CheckIcon sx={{ fontSize: 80, color: "#2e7d32", mb: 2 }} />
            <Typography
              variant="h4"
              gutterBottom
              sx={{ fontWeight: 600, color: "#2e7d32" }}
            >
              Check-in Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              {selectedBorrowings.length} book(s) have been returned from{" "}
              <strong>{selectedUser?.name}</strong>.
            </Typography>
            <Button variant="contained" onClick={handleReset} size="large">
              Check-in Another Book
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Checkin;
