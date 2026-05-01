import React from "react";
import { Box, CssBaseline } from "@mui/material";
import Sidebar from "./Sidebar";
import Parcel from "single-spa-react/parcel";
import { LayoutProps } from "../utils/interfaces";
import { NAVBAR_HEIGHT, SIDEBAR_WIDTH } from "../utils/constants";

export default function Layout({ children }: LayoutProps) {
  return (
    <Box
      sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f4f6f8" }}
    >
      <CssBaseline />

      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1201,
          height: NAVBAR_HEIGHT,
        }}
      >
        <Parcel
          config={() => (System as any).import("@lms/navbar")}
          wrapWith="div"
        />
      </Box>

      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          // ml: { sm: `${SIDEBAR_WIDTH}px` },
          ml: { sm: 0 },
          mt: `${NAVBAR_HEIGHT}px`,
          p: 0,
          backgroundColor: "#f4f6f8",
          minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        }}
      >
        {children}
      </Box>

      <Parcel
        config={() => (System as any).import("@lms/chat-assistant")}
        wrapWith="div"
      />
    </Box>
  );
}
