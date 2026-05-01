import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
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
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Book as BookIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  LibraryBooks as LibraryBooksIcon,
} from "@mui/icons-material";
import {
  searchUsersByName,
  getActiveBorrowingsByUserId,
  getTotalUnpaidPenaltiesByUserId,
  getBookCopyDetails,
} from "../api/queries";

import { checkoutBooks } from "../api/mutations";
import { Userin, BookCopyPreview } from "../utils/interfaces";
import {
  borrowingPeriod,
  maxBorrowableBooks,
  minBorrowableBooks,
} from "../utils/constants";

const steps = [
  "Search Member",
  "Validate Eligibility",
  "Enter Book Copies",
  "Confirmation",
];

const Checkout: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Userin[]>([]);
  const [selectedUser, setSelectedUser] = useState<Userin | null>(null);
  const [activeBorrowingsCount, setActiveBorrowingsCount] = useState(0);
  const [totalPenalties, setTotalPenalties] = useState(0);
  const [isEligible, setIsEligible] = useState(false);
  const [numBooks, setNumBooks] = useState(1);
  const [bookCopyIds, setBookCopyIds] = useState<string[]>([""]);
  const [bookPreviews, setBookPreviews] = useState<(BookCopyPreview | null)[]>([
    null,
  ]);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Search members by name or username
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

  // Get active borrowings and penalties for selected user
  const handleSelectUser = async (user: Userin) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery("");

    try {
      setLoading(true);
      const [borrowings, penalties] = await Promise.all([
        getActiveBorrowingsByUserId(user.id),
        getTotalUnpaidPenaltiesByUserId(user.id),
      ]);
      setActiveBorrowingsCount(borrowings.length);
      setTotalPenalties(penalties);

      const eligible =
        borrowings.length < maxBorrowableBooks && penalties === 0;
      setIsEligible(eligible);
      setActiveStep(1);
    } catch (err: any) {
      setError(err.message || "Failed to check eligibility");
    } finally {
      setLoading(false);
    }
  };

  // Proceed to book entry step
  const handleProceedToBookEntry = () => {
    if (!isEligible) {
      setError("Member is not eligible for checkout");
      return;
    }

    const maxBooks = 2 - activeBorrowingsCount;
    setNumBooks(1);
    setBookCopyIds([""]);
    setBookPreviews([null]);
    setActiveStep(2);
  };

  // Handle number of books change since a member can borrow one or two books
  const handleNumBooksChange = (num: number) => {
    setNumBooks(num);
    const newIds = Array(num).fill("");
    const newPreviews = Array(num).fill(null);
    setBookCopyIds(newIds);
    setBookPreviews(newPreviews);
  };

  // Handle book copy ID input change and fetch preview
  const handleBookCopyIdChange = async (index: number, value: string) => {
    const newIds = [...bookCopyIds];
    // Checking whether the entered book copy ID is duplicate
    if (newIds.includes(value)) {
      setError("Duplicate book copy IDs are not allowed");
      return;
    } else {
      setError(null);
    }
    newIds[index] = value;
    setBookCopyIds(newIds);

    if (value.trim()) {
      try {
        const bookData = await getBookCopyDetails(value);
        const newPreviews = [...bookPreviews];
        newPreviews[index] = {
          id: value,
          bookTitle: bookData.book.title,
          authorName: bookData.book.author.name,
          isAvailable: bookData.isAvailable,
          isDamaged: bookData.isDamaged,
          exists: true,
        };
        setBookPreviews(newPreviews);
      } catch (err: any) {
        const newPreviews = [...bookPreviews];
        newPreviews[index] = {
          id: value,
          bookTitle: "",
          authorName: "",
          isAvailable: false,
          isDamaged: false,
          exists: false,
          error: "Book copy not found",
        };
        setBookPreviews(newPreviews);
      }
    } else {
      const newPreviews = [...bookPreviews];
      newPreviews[index] = null;
      setBookPreviews(newPreviews);
    }
  };

  // Check if all book copies are valid to proceed
  const canProceedToConfirmation = () => {
    return bookPreviews.every(
      (preview) =>
        preview && preview.exists && preview.isAvailable && !preview.isDamaged
    );
  };

  // Handle the final checkout process
  const handleCheckout = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      setError(null);

      await checkoutBooks(selectedUser.id, bookCopyIds);

      setCheckoutSuccess(true);
      setActiveStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to checkout books");
    } finally {
      setLoading(false);
    }
  };

  // Reset the entire checkout process
  const handleReset = () => {
    setActiveStep(0);
    setSelectedUser(null);
    setSearchQuery("");
    setSearchResults([]);
    setActiveBorrowingsCount(0);
    setTotalPenalties(0);
    setIsEligible(false);
    setNumBooks(1);
    setBookCopyIds([""]);
    setBookPreviews([null]);
    setCheckoutSuccess(false);
    setError(null);
  };

  // Calculate due date (14 days from today)
  const calculateDueDate = () => {
    const due = new Date();
    due.setDate(due.getDate() + borrowingPeriod);
    return due.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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
          <LibraryBooksIcon fontSize="large" /> Check-out Books
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Issue books to library members
        </Typography>
      </Box>

      {/* Stepper  */}
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
              Member Eligibility Check
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
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    bgcolor: activeBorrowingsCount < 2 ? "#e8f5e9" : "#ffebee",
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Active Borrowings
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {activeBorrowingsCount} / 2
                        </Typography>
                      </Box>
                      {activeBorrowingsCount < 2 ? (
                        <CheckIcon sx={{ fontSize: 48, color: "#2e7d32" }} />
                      ) : (
                        <CancelIcon sx={{ fontSize: 48, color: "#d32f2f" }} />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card
                  sx={{ bgcolor: totalPenalties === 0 ? "#e8f5e9" : "#ffebee" }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Unpaid Penalties
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          Rs {totalPenalties.toFixed(2)}
                        </Typography>
                      </Box>
                      {totalPenalties === 0 ? (
                        <CheckIcon sx={{ fontSize: 48, color: "#2e7d32" }} />
                      ) : (
                        <WarningIcon sx={{ fontSize: 48, color: "#d32f2f" }} />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {isEligible ? (
              <Alert severity="success" sx={{ mb: 3 }}>
                ✓ Member is eligible to borrow books. Can borrow up to{" "}
                {2 - activeBorrowingsCount} book(s).
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 3 }}>
                ✗ Member is NOT eligible.
                {activeBorrowingsCount >= 2 &&
                  " Maximum borrowing limit reached."}
                {totalPenalties > 0 && " Please clear unpaid penalties first."}
              </Alert>
            )}

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                onClick={() => setActiveStep(0)}
                startIcon={<ArrowBackIcon />}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleProceedToBookEntry}
                disabled={!isEligible}
                endIcon={<ArrowForwardIcon />}
              >
                Proceed to Book Entry
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
              Enter Book Copy IDs
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" gutterBottom>
                How many books to check out?
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                {[1, 2 - activeBorrowingsCount]
                  .filter((n) => n > 0 && n <= 2)
                  .map((n) => (
                    <Button
                      key={n}
                      variant={numBooks === n ? "contained" : "outlined"}
                      onClick={() => handleNumBooksChange(n)}
                      sx={{ minWidth: 100 }}
                    >
                      {n} Book{n > 1 ? "s" : ""}
                    </Button>
                  ))}
              </Box>
            </Box>

            {bookCopyIds.map((id, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label={`Book Copy ID ${index + 1}`}
                  variant="outlined"
                  value={id}
                  onChange={(e) =>
                    handleBookCopyIdChange(index, e.target.value)
                  }
                  placeholder="Enter book copy ID"
                  sx={{ mb: 2 }}
                />

                {bookPreviews[index] && (
                  <Card
                    sx={{
                      bgcolor:
                        bookPreviews[index]!.exists &&
                        bookPreviews[index]!.isAvailable &&
                        !bookPreviews[index]!.isDamaged
                          ? "#e8f5e9"
                          : "#ffebee",
                      border: "2px solid",
                      borderColor:
                        bookPreviews[index]!.exists &&
                        bookPreviews[index]!.isAvailable &&
                        !bookPreviews[index]!.isDamaged
                          ? "#2e7d32"
                          : "#d32f2f",
                    }}
                  >
                    <CardContent>
                      {bookPreviews[index]!.exists ? (
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              mb: 2,
                            }}
                          >
                            <BookIcon sx={{ fontSize: 32, color: "#1976d2" }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6">
                                {bookPreviews[index]!.bookTitle}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                by {bookPreviews[index]!.authorName}
                              </Typography>
                            </Box>
                          </Box>
                          <Box
                            sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
                          >
                            <Chip
                              label={
                                bookPreviews[index]!.isAvailable
                                  ? "Available"
                                  : "Not Available"
                              }
                              color={
                                bookPreviews[index]!.isAvailable
                                  ? "success"
                                  : "error"
                              }
                              size="small"
                            />
                            <Chip
                              label={
                                bookPreviews[index]!.isDamaged
                                  ? "Damaged"
                                  : "Good Condition"
                              }
                              color={
                                bookPreviews[index]!.isDamaged
                                  ? "error"
                                  : "success"
                              }
                              size="small"
                            />
                          </Box>
                        </Box>
                      ) : (
                        <Alert severity="error" sx={{ p: 0 }}>
                          {bookPreviews[index]!.error}
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Box>
            ))}

            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
                mt: 4,
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
                onClick={() => setActiveStep(3)}
                disabled={!canProceedToConfirmation()}
                endIcon={<ArrowForwardIcon />}
              >
                Proceed to Confirmation
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 3 && !checkoutSuccess && (
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mb: 3 }}
            >
              Confirm Check-out
            </Typography>

            <Card sx={{ mb: 3, bgcolor: "#f9f9f9" }}>
              <CardContent>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  Member Details
                </Typography>
                <Typography variant="body1">
                  <strong>{selectedUser?.name}</strong> (@
                  {selectedUser?.username})
                </Typography>
              </CardContent>
            </Card>

            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              Books to Check-out
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
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
                      Due Date
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookPreviews.map(
                    (preview, index) =>
                      preview && (
                        <TableRow key={index}>
                          <TableCell>{preview.id}</TableCell>
                          <TableCell>{preview.bookTitle}</TableCell>
                          <TableCell>{preview.authorName}</TableCell>
                          <TableCell>
                            <Chip
                              label={calculateDueDate()}
                              color="primary"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      )
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Alert severity="info" sx={{ mb: 3 }}>
              Due date is automatically set to 14 days from today.
            </Alert>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                onClick={() => setActiveStep(2)}
                startIcon={<ArrowBackIcon />}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleCheckout}
                disabled={loading}
                endIcon={<CheckIcon />}
                sx={{ minWidth: 150 }}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  "Complete Check-out"
                )}
              </Button>
            </Box>
          </Box>
        )}

        {checkoutSuccess && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CheckIcon sx={{ fontSize: 80, color: "#2e7d32", mb: 2 }} />
            <Typography
              variant="h4"
              gutterBottom
              sx={{ fontWeight: 600, color: "#2e7d32" }}
            >
              Check-out Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              {numBooks} book(s) have been checked out to{" "}
              <strong>{selectedUser?.name}</strong>.
            </Typography>
            <Button variant="contained" onClick={handleReset} size="large">
              Check-out Another Book
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Checkout;
