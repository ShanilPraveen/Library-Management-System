import React from "react";
import AutoStoriesTwoToneIcon from "@mui/icons-material/AutoStoriesTwoTone";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import { Avatar, IconButton, Tooltip } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuthStore } from "@lms/auth-client";


export default function Navbar() {
  const username = useAuthStore((state) => state.user?.username) || "Guest";
  const role = useAuthStore((state) => state.user?.role) || "Guest";

  return (
    <div style={styles.navbar}>
      <div style={styles.leftSection}>
        <div style={styles.logoContainer}>
          <AutoStoriesTwoToneIcon sx={{ fontSize: 28, color: "#64b5f6" }} />
          <span style={styles.logoText}>Library Management System</span>
        </div>
      </div>

      <div style={styles.rightSection}>
        <div style={styles.userInfo}>
          <AccountCircleRoundedIcon
            sx={{ fontSize: 28, color: "#64b5f6", marginRight: "4px" }}
          />
          <span style={styles.username}>{username}</span>
          <span style={styles.roleBadge}>{role}</span>
        </div>

        <Tooltip title="Logout">
          <button onClick={() => useAuthStore.getState().logout()} style={styles.logoutButton}>
            <LogoutIcon fontSize="small" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 24px",
    backgroundColor: "#0f38a6ff",
    color: "white",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    height: "64px",
    width: "100%",
  },
  leftSection: { display: "flex", alignItems: "center" },
  logoContainer: { display: "flex", alignItems: "center", gap: "12px" },
  logoText: { fontSize: "20px", fontWeight: 600, letterSpacing: "0.5px" },
  rightSection: { display: "flex", alignItems: "center", gap: "20px" },
  userInfo: { display: "flex", alignItems: "center", gap: "6px" },
  welcomeText: { fontSize: "13px", color: "#94a3b8" },
  username: { fontSize: "14px", fontWeight: 500, color: "#f1f5f9" },
  roleBadge: {
    fontSize: "11px",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    color: "#38bdf8",
    padding: "2px 8px",
    borderRadius: "12px",
    border: "1px solid rgba(56, 189, 248, 0.2)",
    marginLeft: "8px",
    textTransform: "uppercase" as const,
    fontWeight: 700,
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#cbd5e1",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  } as React.CSSProperties,
};
