import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Tooltip,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
import { debounce } from "lodash";
import { searchUsersByName, getUsersByRole } from "../api/queries";
import { registerUser, updateUser } from "../api/mutations";
import { User, RegisterUserInput, Role } from "../utils/interfaces";
import {
  DebounceDelay,
  length,
  upper,
  lower,
  symbols,
  numbers,
} from "../utils/constants";
import { useForm, SubmitHandler } from "react-hook-form";

ModuleRegistry.registerModules([AllCommunityModule]);

const MemberManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<User[]>([]);

  // Modals
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);

  // Selected data
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  // Form data
  const [formData, setFormData] = useState<RegisterUserInput>({
    username: "",
    name: "",
    role: Role.MEMBER,
    address: "",
    age: 0,
    nic: "",
    phone: "",
    temporaryPassword: "",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterUserInput>({
    defaultValues: {
      username: "",
      name: "",
      address: "",
      age: undefined,
      nic: "",
      phone: "",
    },
  });

  // New member credentials
  const [newCredentials, setNewCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    loadMembers("");
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        loadMembers(query);
      }, DebounceDelay),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  // Load member according to search query
  const loadMembers = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      let result: User[];
      if (query) {
        const nameResults = await searchUsersByName(query);
        result = nameResults.filter((user) => user.role === "MEMBER");
      } else {
        result = await getUsersByRole("MEMBER");
      }
      setMembers(result);
    } catch (err: any) {
      setError(err.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  // Generate a random temporary password
  const generateTemporaryPassword = (): string => {
    let password = [
      upper.charAt(Math.floor(Math.random() * upper.length)),
      lower.charAt(Math.floor(Math.random() * lower.length)),
      numbers.charAt(Math.floor(Math.random() * numbers.length)),
      symbols.charAt(Math.floor(Math.random() * symbols.length)),
    ].join("");

    const allChars = upper + lower + numbers + symbols;
    for (let i = password.length; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    return password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");
  };

  // Handlers to open modals

  // const handleRegisterMember = () => {
  //   setFormData({
  //     username: "",
  //     name: "",
  //     role: Role.MEMBER,
  //     address: "",
  //     age: 0,
  //     nic: "",
  //     phone: "",
  //     temporaryPassword: "",
  //   });
  //   setRegisterModalOpen(true);
  // };

  const handleRegisterMember = () => {
    reset();
    setRegisterModalOpen(true);
  };

  const handleEditMember = (member: User) => {
    setSelectedMember(member);
    setFormData({
      username: member.username,
      name: member.name,
      role: member.role,
      address: member.address || "",
      age: member.age || 0,
      nic: member.nic || "",
      phone: member.phone || "",
    });
    setEditModalOpen(true);
  };

  const handleViewDetails = (member: User) => {
    setSelectedMember(member);
    setViewDetailsModalOpen(true);
  };

  // Register and Edit submission handlers
  // const submitRegisterMember = async () => {
  //   if (!formData.username.trim() || !formData.name.trim()) {
  //     setError("Username and name are required");
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     setError(null);
  //     const tempPassword = generateTemporaryPassword();

  //     // Register user
  //     await registerUser({
  //       username: formData.username.trim(),
  //       name: formData.name.trim(),
  //       role: "MEMBER",
  //       address: formData.address?.trim(),
  //       age: formData.age && formData.age > 0 ? formData.age : undefined,
  //       nic: formData.nic?.trim(),
  //       phone: formData.phone?.trim(),
  //       temporaryPassword: tempPassword,
  //     });

  //     // Store credentials to show
  //     setNewCredentials({
  //       username: formData.username.trim(),
  //       password: tempPassword,
  //     });

  //     setRegisterModalOpen(false);
  //     setCredentialsModalOpen(true);
  //     loadMembers(searchQuery);
  //   } catch (err: any) {
  //     setError(err.message || "Failed to register member");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const onSubmit: SubmitHandler<RegisterUserInput> = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const tempPassword = generateTemporaryPassword();

      // Register user
      await registerUser({
        username: data.username.trim(),
        name: data.name.trim(),
        role: Role.MEMBER,
        address: data.address?.trim(),
        age: data.age,
        nic: data.nic?.trim(),
        phone: data.phone?.trim(),
        temporaryPassword: tempPassword,
      });

      // Show credentials
      setNewCredentials({
        username: data.username.trim(),
        password: tempPassword,
      });

      setRegisterModalOpen(false);
      setCredentialsModalOpen(true);
      loadMembers(searchQuery);
    } catch (err: any) {
      setError(err.message || "Failed to register member");
    } finally {
      setLoading(false);
    }
  };

  const submitEditMember = async () => {
    if (!selectedMember || !formData.name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await updateUser(selectedMember.id, {
        name: formData.name.trim(),
        address: formData.address?.trim(),
        age: formData.age && formData.age > 0 ? formData.age : undefined,
        nic: formData.nic?.trim(),
        phone: formData.phone?.trim(),
      });

      setSuccess(`Member "${formData.name}" updated successfully!`);
      setEditModalOpen(false);
      loadMembers(searchQuery);
    } catch (err: any) {
      setError(err.message || "Failed to update member");
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard (username/password)
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard!");
  };

  // Table
  const ActionsRenderer = (props: any) => {
    const member: User = props.data;
    return (
      <Box sx={{ display: "flex", gap: 1 }}>
        <Tooltip title="View Details">
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleViewDetails(member)}
          >
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit Profile">
          <IconButton
            size="small"
            color="info"
            onClick={() => handleEditMember(member)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  const columnDefs: ColDef[] = [
    {
      field: "name",
      headerName: "Name",
      width: 200,
      sortable: true,
      filter: true,
    },
    {
      field: "username",
      headerName: "Username",
      width: 150,
      sortable: true,
      filter: true,
    },
    { field: "address", headerName: "Address", width: 220, sortable: true },
    { field: "age", headerName: "Age", width: 80, sortable: true },
    { field: "nic", headerName: "NIC", width: 150, sortable: true },
    { field: "phone", headerName: "Phone", width: 150, sortable: true },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      cellRenderer: ActionsRenderer,
      sortable: false,
      filter: false,
    },
  ];

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: "#1976d2",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <PersonIcon fontSize="large" /> Member Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and register library members
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleRegisterMember}
          sx={{
            background: "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
            color: "white",
            "&:hover": {
              background: "linear-gradient(45deg, #1565c0 30%, #1976d2 90%)",
            },
          }}
        >
          Register New Member
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by name or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>
      <Paper sx={{ height: 600, width: "100%" }}>
        {loading && members.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress size={60} />
          </Box>
        ) : members.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              gap: 2,
            }}
          >
            <PersonIcon sx={{ fontSize: 60, color: "#ccc" }} />
            <Typography variant="h6" color="text.secondary">
              {searchQuery
                ? "No members found matching your search"
                : "No members registered"}
            </Typography>
          </Box>
        ) : (
          <AgGridReact
            rowData={members}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={15}
            domLayout="normal"
          />
        )}
      </Paper>
      
      // Register Member Dialog
      {/* <Dialog
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#1976d2", color: "white" }}>
          <Typography variant="h6">Register New Member</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Username *"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="Enter username..."
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Full Name *"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter full name..."
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter address..."
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Age"
                type="number"
                value={formData.age || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    age: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="Enter age..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="NIC"
                value={formData.nic}
                onChange={(e) =>
                  setFormData({ ...formData, nic: e.target.value })
                }
                placeholder="Enter NIC..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Enter phone..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRegisterModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitRegisterMember}
            disabled={
              !formData.username.trim() || !formData.name.trim() || loading
            }
          >
            {loading ? <CircularProgress size={24} /> : "Register Member"}
          </Button>
        </DialogActions>
      </Dialog> */}

      <Dialog
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle sx={{ bgcolor: "#1976d2", color: "white" }}>
            <Typography variant="h6">Register New Member</Typography>
          </DialogTitle>

          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Username *"
                  placeholder="Enter username..."
                  // Register with validation
                  {...register("username", {
                    required: "Username is required",
                  })}
                  error={!!errors.username}
                  helperText={errors.username?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Full Name *"
                  placeholder="Enter full name..."
                  {...register("name", {
                    required: "Full name is required",
                    pattern: {
                      value: /^[A-Za-z\s]+$/,
                      message: "Name can only contain letters",
                    },
                  })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  placeholder="Enter address..."
                  multiline
                  rows={2}
                  {...register("address",{
                    required: "Address is required",
                  })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Age"
                  type="number"
                  placeholder="Enter age..."
                  {...register("age", {
                    valueAsNumber: true,
                    min: { value: 1, message: "Age must be positive" },
                  })}
                  error={!!errors.age}
                  helperText={errors.age?.message}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="NIC"
                  placeholder="Enter NIC..."
                  {...register("nic",{
                    required: "NIC is required",
                  })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Phone"
                  placeholder="Enter phone..."
                  {...register("phone", {
                    pattern: {
                      value: /^[0-9+\-\s]+$/, 
                      message: "Please enter a valid phone number",
                    },
                    minLength: {
                      value: 10,
                      message: "Phone number is too short",
                    },
                  })}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setRegisterModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Register Member"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      //Edit Member Dialog
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#1976d2", color: "white" }}>
          <Typography variant="h6">Edit Member Profile</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                disabled
                helperText="Username cannot be changed"
              />
            </Grid>
            <Grid item xs={12} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Full Name *"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter full name..."
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter address..."
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Age"
                type="number"
                value={formData.age || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    age: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="Enter age..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="NIC"
                value={formData.nic}
                onChange={(e) =>
                  setFormData({ ...formData, nic: e.target.value })
                }
                placeholder="Enter NIC..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Enter phone..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitEditMember}
            disabled={!formData.name.trim() || loading}
          >
            {loading ? <CircularProgress size={24} /> : "Update Profile"}
          </Button>
        </DialogActions>
      </Dialog>
      //View Details Modal
      <Dialog
        open={viewDetailsModalOpen}
        onClose={() => setViewDetailsModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#1976d2", color: "white" }}>
          <Typography variant="h6">Member Details</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedMember && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card sx={{ bgcolor: "#f5f5f5" }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {selectedMember.name}
                    </Typography>
                    <Chip
                      label={selectedMember.role}
                      color="primary"
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">
                          Username:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">
                          {selectedMember.username}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">
                          Address:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">
                          {selectedMember.address || "N/A"}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">
                          Age:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">
                          {selectedMember.age || "N/A"}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">
                          NIC:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">
                          {selectedMember.nic || "N/A"}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">
                          Phone:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">
                          {selectedMember.phone || "N/A"}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">
                          Registered:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">
                          {new Date(
                            parseInt(selectedMember.createdAt)
                          ).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewDetailsModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={credentialsModalOpen}
        onClose={() => setCredentialsModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#4caf50", color: "white" }}>
          <Typography variant="h6">Member Registered Successfully!</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Member registered successfully! Share these credentials with the
              member.
            </Typography>
          </Alert>
          {newCredentials && (
            <Paper sx={{ p: 3, bgcolor: "#f5f5f5" }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Username:
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(newCredentials.username)}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ fontFamily: "monospace", color: "#1976d2" }}
                  >
                    {newCredentials.username}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Temporary Password:
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(newCredentials.password)}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ fontFamily: "monospace", color: "#d32f2f" }}
                  >
                    {newCredentials.password}
                  </Typography>
                </Grid>
              </Grid>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  The member should login with this username and temporary
                  password, then reset the password immediately.
                </Typography>
              </Alert>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            onClick={() => setCredentialsModalOpen(false)}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemberManagement;
