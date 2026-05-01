import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Paper,
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Badge as BadgeIcon,
  Cake as CakeIcon,
  LibraryBooks as BooksIcon,
  AccountCircle as AccountIcon,
} from "@mui/icons-material";
import {
  getUserDataById,
  getActiveBorrowingsByUserId,
  getTotalUnpaidPenaltiesByUserId,
} from "../api/queries";
import { getUserId } from "../utils/auth";
import { User, LabelColor } from "../utils/interfaces";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBorrowingsCount, setActiveBorrowingsCount] = useState(0);
  const [totalPenalties, setTotalPenalties] = useState(0);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = getUserId();

      // Load user data
      const userData = await getUserDataById(userId);
      setUser(userData);

      // Load borrowing statistics
      const borrowings = await getActiveBorrowingsByUserId(userId);
      setActiveBorrowingsCount(borrowings.length);

      // Load penalty information
      const penalties = await getTotalUnpaidPenaltiesByUserId(userId);
      setTotalPenalties(penalties);
    } catch (err: any) {
      setError(err.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return (
      <Box p={3}>
        <Alert severity={LabelColor.ERROR}>{error}</Alert>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box p={3}>
        <Alert severity={LabelColor.WARNING}>User profile not found</Alert>
      </Box>
    );
  }

  // Function to get initials from name
  const getInitials = (name: string): string => {
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <Box display="flex" alignItems="center" gap={3}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              fontSize: "2.5rem",
              fontWeight: 600,
              bgcolor: "rgba(255, 255, 255, 0.3)",
              border: "4px solid rgba(255, 255, 255, 0.5)",
            }}
          >
            {getInitials(user.name)}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              {user.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <AccountIcon />
              <Typography variant="h6">@{user.username}</Typography>
            </Box>
            <Chip
              icon={<BooksIcon />}
              label="Library Member"
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card
            elevation={2}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h3" fontWeight={700}>
                    {activeBorrowingsCount}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Active Borrowings
                  </Typography>
                </Box>
                <BooksIcon sx={{ fontSize: 60, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            elevation={2}
            sx={{
              background:
                totalPenalties > 0
                  ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                  : "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h3" fontWeight={700}>
                    Rs {totalPenalties.toFixed(2)}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Unpaid Penalties
                  </Typography>
                </Box>
                <BadgeIcon sx={{ fontSize: 60, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            elevation={2}
            sx={{
              background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
              color: "#333",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h3" fontWeight={700}>
                    Active
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.8 }}>
                    Account Status
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 60, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <PersonIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" fontWeight={600}>
              Personal Information
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box
                display="flex"
                gap={2}
                p={2}
                sx={{ bgcolor: "grey.50", borderRadius: 2 }}
              >
                <AccountIcon color="primary" sx={{ fontSize: 28 }} />
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    USERNAME
                  </Typography>
                  <Typography variant="h6" fontWeight={500}>
                    {user.username}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                display="flex"
                gap={2}
                p={2}
                sx={{ bgcolor: "grey.50", borderRadius: 2 }}
              >
                <PersonIcon color="primary" sx={{ fontSize: 28 }} />
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    FULL NAME
                  </Typography>
                  <Typography variant="h6" fontWeight={500}>
                    {user.name}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                display="flex"
                gap={2}
                p={2}
                sx={{ bgcolor: "grey.50", borderRadius: 2 }}
              >
                <CakeIcon color="primary" sx={{ fontSize: 28 }} />
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    AGE
                  </Typography>
                  <Typography variant="h6" fontWeight={500}>
                    {user.age} years
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                display="flex"
                gap={2}
                p={2}
                sx={{ bgcolor: "grey.50", borderRadius: 2 }}
              >
                <BadgeIcon color="primary" sx={{ fontSize: 28 }} />
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    NIC
                  </Typography>
                  <Typography variant="h6" fontWeight={500}>
                    {user.nic}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <PhoneIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" fontWeight={600}>
              Contact Information
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box
                display="flex"
                gap={2}
                p={2}
                sx={{ bgcolor: "grey.50", borderRadius: 2 }}
              >
                <PhoneIcon color="primary" sx={{ fontSize: 28 }} />
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    PHONE NUMBER
                  </Typography>
                  <Typography variant="h6" fontWeight={500}>
                    {user.phone}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                display="flex"
                gap={2}
                p={2}
                sx={{ bgcolor: "grey.50", borderRadius: 2 }}
              >
                <HomeIcon color="primary" sx={{ fontSize: 28 }} />
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    ADDRESS
                  </Typography>
                  <Typography variant="h6" fontWeight={500}>
                    {user.address}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {totalPenalties > 0 && (
        <Alert severity="warning" sx={{ mt: 3 }} icon={<BadgeIcon />}>
          <Typography variant="body1" fontWeight={600}>
            You have unpaid penalties of Rs {totalPenalties.toFixed(2)}
          </Typography>
          <Typography variant="body2">
            Please pay your penalties to continue borrowing books.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
