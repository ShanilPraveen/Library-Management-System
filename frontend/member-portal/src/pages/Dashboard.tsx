import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  MenuBook as BookIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  ViewList as ViewListIcon,
  WavingHandOutlined as WavingHandOutlinedIcon,
} from "@mui/icons-material";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import {
  getActiveBorrowingsByUserId,
  getTotalUnpaidPenaltiesByUserId,
  getNotificationsByUserId,
  getUserDataById,
} from "../api/queries";
import { Notification } from "../utils/interfaces";
import bookimage from "../../public/alexei-maridashvili-VeNJNwCux6Y-unsplash.jpg";
import {
  sliceStartIndex,
  sliceEndIndex,
  maxDifDays,
  minDifDays,
  milisecondsInADay,
  defaultZero,
} from "../utils/constants";
import { getUserId, isAuthenticated } from "../utils/auth";

export default function Dashboard() {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("Member");
  const [stats, setStats] = useState({
    activeBorrowings: defaultZero,
    dueSoon: defaultZero,
    totalPenalties: defaultZero,
  });
  const [recentNotifications, setRecentNotifications] = useState<
    Notification[]
  >([]);

  useEffect(() => {
    if (!isAuthenticated) {
      console.log("User not authenticated, redirecting to login.");
      history.push("/login");
      return;
    }
    loadDashboardData();
  }, []);

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const userId = getUserId();

      // Load user data
      const userData = await getUserDataById(userId);
      if (userData) {
        setUsername(userData.name);
      }

      // Load active borrowings
      const borrowings = await getActiveBorrowingsByUserId(userId);

      // books due in 7 days or less
      const dueSoonCount = getDueDataCount(borrowings);

      // Load penalties
      const penalties = await getTotalUnpaidPenaltiesByUserId(userId);

      // Load recent notifications
      const notifications = await getNotificationsByUserId(userId);
      const recent = notifications.slice(sliceStartIndex, sliceEndIndex);

      setStats({
        activeBorrowings: borrowings.length,
        dueSoon: dueSoonCount,
        totalPenalties: penalties,
      });

      setRecentNotifications(recent);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Determine notification severity based on content
  const getNotificationSeverity = (content: string, isRead: boolean) => {
    const lowerContent = content.toLowerCase();
    if (
      lowerContent.includes("accepted") ||
      lowerContent.includes("approved")
    ) {
      return "success";
    }
    if (lowerContent.includes("overdue") || lowerContent.includes("late")) {
      return "error";
    }
    if (lowerContent.includes("due") || lowerContent.includes("reminder")) {
      return "warning";
    }
    return "info";
  };

  // Calculate the count of borrowings due soon
  const getDueDataCount = (borrowings) => {
    const now = new Date();
    const dueSoonCount = borrowings.filter((b) => {
      const dueDate = new Date(parseInt(b.dueDate));
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / milisecondsInADay);
      return diffDays <= maxDifDays && diffDays >= minDifDays;
    }).length;

    return dueSoonCount;
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

  return (
    <Box
      sx={{
        flexGrow: 1,
        p: 0,
        position: "relative",
        overflow: "hidden",
        minHeight: "100%",

        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${bookimage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "grayscale(100%)",
          opacity: 0,
          zIndex: 0,
        },

        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#f4f6f8",
          // backgroundColor: 'linear-gradient(to right, #f4f6f6 100%, rgba(244, 246, 246, 0) 0%)',
          zIndex: 0,
        },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1, p: 3 }}>
        <Box mb={3}>
          <Typography variant="h4" gutterBottom color="#000000ff">
            Welcome, {username}!
          </Typography>
          <Typography variant="h6" gutterBottom color="#000000ff">
            Here's what's happening with your library account today.
          </Typography>
        </Box>

        <Grid container spacing={3} mb={4}>
          {/* Active Borrowings */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <BookIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h3">
                      {stats.activeBorrowings}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Borrowings
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Due Soon */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <WarningIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h3">{stats.dueSoon}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Due Soon
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Penalties */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CurrencyRupeeIcon
                    color="error"
                    sx={{ fontSize: 40, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="h3">
                      Rs {stats.totalPenalties.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Penalties
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Notifications */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Notifications
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {recentNotifications.length === 0 ? (
                <Alert severity="info">No recent notifications</Alert>
              ) : (
                recentNotifications.map((notification) => (
                  <Alert
                    key={notification.id}
                    severity={getNotificationSeverity(
                      notification.content,
                      notification.isRead
                    )}
                    sx={{ mb: 2, opacity: notification.isRead ? 0.7 : 1 }}
                  >
                    {notification.content}
                  </Alert>
                ))
              )}
              <Button
                size="small"
                sx={{ mt: 1 }}
                onClick={() => history.push("/notifications")}
              >
                View All Notifications
              </Button>
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  fullWidth
                  onClick={() => history.push("/search")}
                >
                  Search Books
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ViewListIcon />}
                  fullWidth
                  onClick={() => history.push("/borrowings")}
                >
                  View My Borrowings
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
