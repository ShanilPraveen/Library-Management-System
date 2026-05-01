import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Box,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  LibraryBooks as LibraryBooksIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Feedback as FeedbackIcon,
  MenuBook as NewBookRequestIcon,
} from "@mui/icons-material";
// import { getUserId } from "../utils/auth";
import { useAuthStore } from "@lms/auth-client";
import { getUnreadNotificationsByUserId } from "../api/queries";
import { NAVBAR_HEIGHT } from "../utils/constants";

export default function Sidebar() {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        const userId = useAuthStore.getState().user?.userId;
        if (userId) {
          const notifications = await getUnreadNotificationsByUserId(userId);
          setUnreadCount(notifications.length);
        }
      } catch (err) {
        console.error("Failed to fetch unread notifications:", err);
      }
    };

    fetchUnreadNotifications();
  }, [location.pathname]);

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Search Books", icon: <SearchIcon />, path: "/search" },
    { text: "My Borrowings", icon: <LibraryBooksIcon />, path: "/borrowings" },
    { text: "History", icon: <HistoryIcon />, path: "/history" },
    {
      text: "Notifications",
      icon: <NotificationsIcon />,
      path: "/notifications",
      badge: unreadCount,
    },
    {
      text: "New Request",
      icon: <NewBookRequestIcon />,
      path: "/newbookrequest",
    },
    { text: "Profile", icon: <PersonIcon />, path: "/profile" },
    { text: "Feedback", icon: <FeedbackIcon />, path: "/feedback" },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 280,
          boxSizing: "border-box",
          top: NAVBAR_HEIGHT,
          height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          borderRight: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
        },
      }}
    >
      <Box sx={{ overflow: "auto", py: 2 }}>
        <List>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <ListItem
                button
                key={item.text}
                component={Link}
                to={item.path}
                sx={{
                  mb: 0.5,
                  mx: 1.5,
                  borderRadius: "8px",
                  width: "auto",
                  backgroundColor: isActive ? "#eff6ff" : "transparent",
                  color: isActive ? "#1d4ed8" : "#64748b",
                  borderLeft: isActive
                    ? "4px solid #1d4ed8"
                    : "4px solid transparent",
                  "&:hover": {
                    backgroundColor: isActive ? "#eff6ff" : "#f8fafc",
                    color: isActive ? "#1d4ed8" : "#1e293b",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "inherit",
                    minWidth: 40,
                    "& .MuiSvgIcon-root": { fontSize: 22 },
                  }}
                >
                  {item.badge ? (
                    <Badge
                      badgeContent={item.badge}
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: 10,
                          height: 16,
                          minWidth: 16,
                        },
                      }}
                    >
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
}
