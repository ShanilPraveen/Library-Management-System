import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Badge,
} from "@mui/material";
import {
  MenuBook as BookIcon,
  People as PeopleIcon,
  Warning as WarningIcon,
  ExitToApp as CheckOutIcon,
  Login as CheckInIcon,
  Refresh as RenewalIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import {
  getTotalBooksCount,
  getTotalMembersCount,
  getOverdueBorrowingsCount,
  getRecentBorrowings,
  getPendingRenewalsCount,
} from "../api/queries";
import { getUserRole } from "../utils/auth";
import { RecentActivity, StatCardData } from "../utils/interfaces";
import { formatDistanceToNow } from "date-fns";
import { recentBorrowingsLimit } from "../utils/constants";

const Dashboard: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");

  // Statistics
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [overdueBooks, setOverdueBooks] = useState(0);
  const [pendingRenewals, setPendingRenewals] = useState(0);

  // Recent activity
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );

  useEffect(() => {
    const userRole = getUserRole();
    setRole(userRole || "");
    loadDashboardData();
  }, []);

  /**
   * Load all dashboard data: statistics and recent activities
   */
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all statistics
      const [
        booksCount,
        membersCount,
        overdueCount,
        renewalsCount,
        activities,
      ] = await Promise.all([
        getTotalBooksCount(),
        getTotalMembersCount(),
        getOverdueBorrowingsCount(),
        getPendingRenewalsCount(),
        getRecentBorrowings(recentBorrowingsLimit),
      ]);

      setTotalBooks(booksCount);
      setTotalMembers(membersCount);
      setOverdueBooks(overdueCount);
      setPendingRenewals(renewalsCount);
      setRecentActivities(activities);
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const statCards: StatCardData[] = [
    {
      title: "Total Books",
      value: totalBooks,
      icon: <BookIcon sx={{ fontSize: 40 }} />,
      color: "#1976d2",
      bgColor: "#e3f2fd",
    },
    {
      title: "Total Members",
      value: totalMembers,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: "#2e7d32",
      bgColor: "#e8f5e9",
    },
    {
      title: "Overdue Books",
      value: overdueBooks,
      icon: <WarningIcon sx={{ fontSize: 40 }} />,
      color: "#d32f2f",
      bgColor: "#ffebee",
    },
    {
      title: "Pending Renewals",
      value: pendingRenewals,
      icon: <RenewalIcon sx={{ fontSize: 40 }} />,
      color: "#ed6c02",
      bgColor: "#fff3e0",
    },
  ];

  // Format timestamp to relative time 
  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(parseInt(timestamp));
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={loadDashboardData} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 600, color: "#1976d2" }}
        >
          Staff Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's what's happening in your library today.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: "100%",
                background: `linear-gradient(135deg, ${card.bgColor} 0%, ${card.bgColor}ee 100%)`,
                border: `1px solid ${card.color}30`,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: `0 8px 24px ${card.color}40`,
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {card.title}
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 700, color: card.color }}
                    >
                      {card.value}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: card.color,
                      width: 60,
                      height: 60,
                    }}
                  >
                    {card.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {role === "LIBRARIAN" && (
          <Grid item xs={12} md={5}>
            <Paper
              sx={{
                p: 2,
                height: "100%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <TrendingUpIcon /> Quick Actions
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
                Perform common tasks quickly
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CheckOutIcon />}
                  onClick={() => history.push("/checkout")}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                >
                  Check-out Book
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CheckInIcon />}
                  onClick={() => history.push("/checkin")}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                >
                  Check-in Book
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<RenewalIcon />}
                  endIcon={
                    pendingRenewals > 0 ? (
                      <Chip
                        label={pendingRenewals}
                        size="small"
                        sx={{
                          bgcolor: "#d32f2f",
                          color: "white",
                          height: 24,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      />
                    ) : null
                  }
                  onClick={() => history.push("/renewals")}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                >
                  View Renewal Requests
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}
        {role === "ADMIN" && (
          <Grid item xs={12} md={5}>
            <Paper
              sx={{
                p: 2,
                height: "100%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <TrendingUpIcon /> Quick Actions
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
                Perform common tasks quickly
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CheckOutIcon />}
                  onClick={() => history.push("/librarians")}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                >
                  Manage Librarians
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CheckInIcon />}
                  onClick={() => history.push("/feedback")}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                >
                  View Feedbacks
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<RenewalIcon />}
                  endIcon={
                    pendingRenewals > 0 ? (
                      <Chip
                        label={pendingRenewals}
                        size="small"
                        sx={{
                          bgcolor: "#d32f2f",
                          color: "white",
                          height: 24,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      />
                    ) : null
                  }
                  onClick={() => history.push("/newbookrequests")}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                >
                  View New Book Requests
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, color: "#1976d2" }}
            >
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Last 3 transactions
            </Typography>

            {recentActivities.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 4,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No recent activity
                </Typography>
              </Box>
            ) : (
              <List>
                {recentActivities.map((activity, index) => (
                  <ListItem
                    key={activity.id}
                    sx={{
                      bgcolor: index % 2 === 0 ? "#f9f9f9" : "transparent",
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: activity.receivedDate
                            ? "#2e7d32"
                            : "#1976d2",
                        }}
                      >
                        {activity.receivedDate ? (
                          <CheckInIcon />
                        ) : (
                          <CheckOutIcon />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography variant="body2" component="span">
                            <strong>{activity.userName || "Member"}</strong>
                            {activity.receivedDate
                              ? " returned "
                              : " checked out "}
                            <strong>'{activity.bookTitle || "Book"}'</strong>
                          </Typography>
                          <Chip
                            label={
                              activity.receivedDate ? "Returned" : "Checked Out"
                            }
                            size="small"
                            color={
                              activity.receivedDate ? "success" : "primary"
                            }
                            sx={{ height: 20, fontSize: "0.7rem" }}
                          />
                        </Box>
                      }
                      secondary={formatRelativeTime(
                        activity.receivedDate || activity.issuedDate
                      )}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
