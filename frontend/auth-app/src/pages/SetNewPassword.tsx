import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import bookpicture from '../../public/mikolaj-1apc6sAl-SQ-unsplash.jpg';
import { useAuthStore } from '@lms/auth-client';

const SetNewPassword: React.FC = () => {
  const setNewPassword = useAuthStore((state) => state.setNewPassword);
  const [newPassword, setNewPasswordValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    setNewPassword(newPassword, {
      onSuccess: () => {
        setLoading(false);
        // Redirect based on role
        const userRole = useAuthStore.getState().user?.role;
        if (userRole === 'MEMBER') {
          window.location.href = '/dashboard';
        } else if (userRole === 'LIBRARIAN' || userRole === 'ADMIN') {
          window.location.href = '/staff';
        }
      },

      onFailure: (err: any) => {
        setLoading(false);
        setError(err.message || 'Failed to set password');
      }
    });
  };

  return (
    <Box
      sx={{
        height: '100vh',       
        width: '100vw',       
        backgroundImage: `url(${bookpicture})`,
        backgroundSize: 'cover',   
        backgroundPosition: 'center', 
        backgroundRepeat: 'no-repeat', 
        overflow: 'hidden',
        m: 0,                  
        p: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: 400,
          padding: 4,
          borderRadius: 2,
          alignSelf: 'center',
        }}
      >
        <Typography
          variant="h5"
          align="center"
          sx={{ fontWeight: 600, mb: 1 }}
        >
          Set New Password
        </Typography>

        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Please set a new password for your account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="New Password"
            type="password"
            fullWidth
            required
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPasswordValue(e.target.value)}
            helperText="Minimum 8 characters"
          />

          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            required
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.2,
              backgroundColor: '#0d47a1',
              '&:hover': {
                backgroundColor: '#08306b'
              }
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Set Password'
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SetNewPassword;