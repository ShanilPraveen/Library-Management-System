import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Stack,
  Badge,
  Tooltip,
  Button,
} from "@mui/material";
import {
  Notifications as NotificationIcon,
  CheckCircleOutline as ReadIcon,
  FiberManualRecord as UnreadDotIcon,
  MarkEmailRead as MarkAllReadIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  EventAvailable as EventIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { getNotificationsByUserId } from "../api/queries";
import { Notification, LabelColor } from "../utils/interfaces";
import {
  markNotificationAsReadById,
  markAllNotificationsAsReadByUserId,
} from "../api/mutations";
import { getUserId } from "../utils/auth";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [markingRead, setMarkingRead] = useState<number | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  // Load notifications for the user
  const loadNotifications = () => {
    setLoading(true);
    const userId = getUserId();
    getNotificationsByUserId(userId)
      .then((data) => {
        setNotifications(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load notifications");
        setLoading(false);
      });
  };

  // Handle marking a notification as read
  const handleMarkAsRead = (notificationId: number) => {
    setMarkingRead(notificationId);
    markNotificationAsReadById(notificationId)
      .then(() => {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setMarkingRead(null);
      })
      .catch((err) => {
        alert(err.message || "Failed to mark notification as read");
        setMarkingRead(null);
      });
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = () => {
    const userId = getUserId();
    setMarkingAllRead(true);
    markAllNotificationsAsReadByUserId(userId)
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setMarkingAllRead(false);
      })
      .catch((err) => {
        alert(err.message || "Failed to mark all as read");
        setMarkingAllRead(false);
      });
  };

  // Determine icon based on notification content
  const getNotificationIcon = (content: string) => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes("overdue") || lowerContent.includes("late")) {
      return <ErrorIcon color={LabelColor.ERROR} />;
    }
    if (
      lowerContent.includes("accepted") ||
      lowerContent.includes("approved")
    ) {
      return <EventIcon color={LabelColor.SUCCESS} />;
    }
    if (lowerContent.includes("due") || lowerContent.includes("reminder")) {
      return <WarningIcon color={LabelColor.WARNING} />;
    }

    return <InfoIcon color={LabelColor.PRIMARY} />;
  };

  // Format timestamp to relative time
  const formatDate = (timestamp: string): string => {
    return formatDistanceToNow(new Date(parseInt(timestamp)), {
      addSuffix: true,
    });
  };

  // Filter notifications by tab
  const filteredNotifications = notifications.filter((n) => {
    if (tabValue === 0) return true; // All
    if (tabValue === 1) return !n.isRead; // Unread
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationIcon fontSize="large" color="primary" />
            </Badge>
            <Typography variant="h4" fontWeight={600}>
              Notifications
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Stay updated with your library activities and reminders
          </Typography>
        </Box>

        {unreadCount > 0 && (
          <Button
            variant="outlined"
            startIcon={<MarkAllReadIcon />}
            onClick={handleMarkAllAsRead}
            disabled={markingAllRead}
          >
            {markingAllRead ? "Marking..." : "Mark All as Read"}
          </Button>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label={`All (${notifications.length})`} />
          <Tab
            label={
              <Badge badgeContent={unreadCount} color="error">
                <span style={{ marginRight: unreadCount > 0 ? 16 : 0 }}>
                  Unread
                </span>
              </Badge>
            }
          />
        </Tabs>
      </Box>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Alert severity="info" icon={<NotificationIcon />}>
          {tabValue === 1
            ? "No unread notifications. You're all caught up!"
            : "No notifications yet. Check back later for updates."}
        </Alert>
      ) : (
        <Stack spacing={2}>
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              elevation={notification.isRead ? 1 : 3}
              sx={{
                backgroundColor: notification.isRead
                  ? "background.paper"
                  : "action.hover",
                border: notification.isRead ? "none" : "2px solid",
                borderColor: notification.isRead
                  ? "transparent"
                  : "primary.light",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box display="flex" gap={2}>
                  <Box sx={{ pt: 0.5 }}>
                    {getNotificationIcon(notification.content)}
                  </Box>

                  <Box flex={1}>
                    <Box
                      display="flex"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      mb={1}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        {!notification.isRead && (
                          <UnreadDotIcon
                            sx={{ fontSize: 12, color: "primary.main" }}
                          />
                        )}
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: notification.isRead ? 400 : 600,
                            color: notification.isRead
                              ? "text.secondary"
                              : "text.primary",
                          }}
                        >
                          {notification.content}
                        </Typography>
                      </Box>

                      {!notification.isRead && (
                        <Tooltip title="Mark as read">
                          <IconButton
                            size="small"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markingRead === notification.id}
                            sx={{ ml: 1 }}
                          >
                            <ReadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>

                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(notification.createdAt)}
                      </Typography>
                      {notification.isRead && (
                        <Chip
                          label="Read"
                          size="small"
                          color="default"
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.7rem" }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {notifications.length > 0 && (
        <Box display="flex" gap={2} mt={4} justifyContent="center">
          <Chip
            label={`Total: ${notifications.length}`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`Unread: ${unreadCount}`}
            color="error"
            variant={unreadCount > 0 ? "filled" : "outlined"}
          />
          <Chip
            label={`Read: ${notifications.length - unreadCount}`}
            color="success"
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );
}
