import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import bookpicture from "../../public/mikolaj-1apc6sAl-SQ-unsplash.jpg";
import { useAuthStore } from "@lms/auth-client";

const Login: React.FC = () => {
  const login = useAuthStore((state) => state.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    login(username, password, {
      onSuccess: () => {
        setLoading(false);
        const user = useAuthStore.getState().user;
        if (user?.role === "MEMBER") {
          window.location.href = "/dashboard";
        } else if (user?.role === "LIBRARIAN" || user?.role === "ADMIN") {
          console.log("Redirecting to staff portal");
          window.location.href = "/staff";
        }
      },

      onNewPasswordRequired: () => {
        setLoading(false);
        window.location.href = "/set-new-password";
      },

      onFailure: (err: any) => {
        setLoading(false);
        setError(err.message || "Login failed");
      },
    });
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        backgroundImage: `url(${bookpicture})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        m: 0,
        p: 0,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: 400,
          padding: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" align="center" sx={{ fontWeight: 600, mb: 1 }}>
          Library Management System
        </Typography>

        <Typography variant="h5" align="center" sx={{ fontWeight: 600, mb: 1 }}>
          Login
        </Typography>

        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Sign in to continue
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Username"
            fullWidth
            required
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            required
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.2,
              backgroundColor: "#0d47a1",
              "&:hover": {
                backgroundColor: "#08306b",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              "Login"
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
