import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import {
  MenuBookOutlined as BookIcon,
  AutorenewOutlined as RenewIcon,
  EventAvailable as DueDateIcon,
  Warning as WarningIcon,
  CheckCircleOutline as AcceptedIcon,
  CancelOutlined as RejectedIcon,
} from "@mui/icons-material";
import {
  Borrowing,
  LabelColor,
  LabelType,
  RenewalStatus,
} from "../utils/interfaces";
import {
  getActiveBorrowingsByUserId,
  getBookDataByBookCopyId,
} from "../api/queries";
import { requestRenewal } from "../api/mutations";
import { getUserId } from "../utils/auth";
import {
  defaultZero,
  milisecondsInADay,
  remDaysLowerLimit,
  remDaysMidLimit,
  remDaysUpperLimit,
} from "../utils/constants";

export default function MyBorrowings() {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [renewingId, setRenewingId] = useState<number | null>(null);

  useEffect(() => {
    loadBorrowings();
  }, []);

  const loadBorrowings = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = getUserId();

      // Get active borrowings from circulation service
      const borrowingsData = await getActiveBorrowingsByUserId(userId);

      // For each borrowing, fetch book data from catalog service
      const borrowingsWithBookData = await Promise.all(
        borrowingsData.map(async (borrowing) => {
          try {
            const bookData = await getBookDataByBookCopyId(
              borrowing.bookCopyId
            );
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
      setError(err.message || "Failed to load borrowings");
    } finally {
      setLoading(false);
    }
  };

  // Handle renewal request
  const handleRenew = (borrowingId: number) => {
    setRenewingId(borrowingId);
    requestRenewal(borrowingId)
      .then(() => {
        loadBorrowings();
        setRenewingId(null);
      })
      .catch((err) => {
        alert(err.message || "Failed to request renewal");
        setRenewingId(null);
      });
  };

  // Calculate days remaining until due date
  const getDaysRemaining = (dueDate: string): number => {
    const now = new Date();
    const due = new Date(parseInt(dueDate));
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / milisecondsInADay);
    return diffDays;
  };

  // Determine borrowing status color based on days remaining
  const getStatusColor = (daysRemaining: number): LabelColor => {
    if (daysRemaining > remDaysUpperLimit) return LabelColor.SUCCESS;
    if (daysRemaining >= remDaysMidLimit) return LabelColor.WARNING;
    return LabelColor.ERROR;
  };

  // Determine renewal chip color based on status
  const getRenewalChipColor = (status: RenewalStatus): LabelColor => {
    switch (status) {
      case RenewalStatus.PENDING:
        return LabelColor.WARNING;
      case RenewalStatus.ACCEPTED:
        return LabelColor.SUCCESS;
      case RenewalStatus.REJECTED:
        return LabelColor.ERROR;
      default:
        return LabelColor.DEFAULT;
    }
  };

  // Filter borrowings based on selected tab
  const filteredBorrowings = borrowings.filter((b) => {
    const daysRemaining = getDaysRemaining(b.dueDate);
    if (tabValue === 0) return true; // All
    if (tabValue === 1)
      return (
        daysRemaining <= remDaysUpperLimit && daysRemaining > remDaysLowerLimit
      ); // Due Soon
    if (tabValue === 2) return daysRemaining < remDaysLowerLimit; // Overdue
    return true;
  });

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
        My Borrowings
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Manage your borrowed books, request renewals, and track due dates
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label={`All (${borrowings.length})`} />
          <Tab
            label={`Due Soon (${
              borrowings.filter((b) => {
                const d = getDaysRemaining(b.dueDate);
                return d <= 7 && d > 0;
              }).length
            })`}
          />
          <Tab
            label={`Overdue (${
              borrowings.filter((b) => getDaysRemaining(b.dueDate) < 0).length
            })`}
            sx={{
              color: borrowings.some((b) => getDaysRemaining(b.dueDate) < 0)
                ? "error.main"
                : "inherit",
            }}
          />
        </Tabs>
      </Box>

      {filteredBorrowings.length === 0 ? (
        <Alert severity="info">No borrowings found in this category</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredBorrowings.map((borrowing) => {
            const daysRemaining = getDaysRemaining(borrowing.dueDate);
            const statusColor = getStatusColor(daysRemaining);
            const book = borrowing.book;

            return (
              <Grid item xs={12} md={6} lg={4} key={borrowing.id}>
                <Card
                  elevation={2}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 180,
                      backgroundColor: "grey.200",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "3rem",
                    }}
                  >
                    <BookIcon sx={{ fontSize: 150, color: "#0065adff" }} />
                  </CardMedia>

                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      fontWeight={600}
                      noWrap
                    >
                      {book?.title || "Unknown Title"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      by {book?.author?.name || "Unknown Author"}
                    </Typography>

                    <Stack spacing={1.5} mt={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <DueDateIcon
                          fontSize="small"
                          color={
                            statusColor.toLowerCase() as
                              | "inherit"
                              | "primary"
                              | "secondary"
                              | "action"
                              | "error"
                              | "disabled"
                          }
                        />
                        <Typography variant="body2">
                          Due:{" "}
                          {new Date(
                            parseInt(borrowing.dueDate)
                          ).toLocaleDateString()}
                        </Typography>
                        <Chip
                          label={
                            daysRemaining < 0
                              ? `${Math.abs(daysRemaining)} days overdue`
                              : `${daysRemaining} days left`
                          }
                          size="small"
                          color={statusColor}
                        />
                      </Box>

                      {borrowing.renewalStatus !== "NONE" && (
                        <Chip
                          label={`Renewal: ${borrowing.renewalStatus}`}
                          size="small"
                          color={getRenewalChipColor(borrowing.renewalStatus)}
                          icon={
                            borrowing.renewalStatus === "ACCEPTED" ? (
                              <AcceptedIcon />
                            ) : borrowing.renewalStatus === "REJECTED" ? (
                              <RejectedIcon />
                            ) : (
                              <WarningIcon />
                            )
                          }
                        />
                      )}

                      <Typography variant="caption" color="text.secondary">
                        Borrowed:{" "}
                        {new Date(
                          parseInt(borrowing.issuedDate)
                        ).toLocaleDateString()}
                      </Typography>
                    </Stack>

                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<RenewIcon />}
                      disabled={
                        borrowing.renewalStatus === "PENDING" ||
                        borrowing.renewalStatus === "ACCEPTED" ||
                        borrowing.renewalStatus === "REJECTED" ||
                        renewingId === borrowing.id
                      }
                      onClick={() => handleRenew(borrowing.id)}
                      sx={{ mt: 2 }}
                    >
                      {renewingId === borrowing.id
                        ? "Requesting..."
                        : borrowing.renewalStatus === "PENDING"
                        ? "Renewal Pending"
                        : "Request Renewal"}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
