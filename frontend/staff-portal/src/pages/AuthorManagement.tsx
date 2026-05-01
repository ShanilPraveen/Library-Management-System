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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Book as BookIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
import { debounce } from "lodash";
import { searchAuthorsByName, getBooksByAuthorId } from "../api/queries";
import { createAuthor, updateAuthor, deleteAuthor } from "../api/mutations";
import { AuthorWithStats } from "../utils/interfaces";
import { DefaultZero,DebounceDelay } from "../utils/constants";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const AuthorManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [authors, setAuthors] = useState<AuthorWithStats[]>([]);

  // Modals
  const [addAuthorModalOpen, setAddAuthorModalOpen] = useState(false);
  const [editAuthorModalOpen, setEditAuthorModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Selected data
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorWithStats | null>(
    null
  );

  // Form data
  const [authorName, setAuthorName] = useState("");

  useEffect(() => {
    loadAuthors("");
  }, []);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        loadAuthors(query);
      }, DebounceDelay),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  // Load authors with book counts for a given search query
  const loadAuthors = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch authors based on search query
      const authorsResult = await searchAuthorsByName(query);

      // For each author, get book count
      const authorsWithStats = await Promise.all(
        authorsResult.map(async (author) => {
          try {
            const books = await getBooksByAuthorId(author.id);
            return {
              ...author,
              totalBooks: books.length,
            };
          } catch (err) {
            console.error(`Failed to load books for author ${author.id}:`, err);
            return {
              ...author,
              totalBooks: DefaultZero,
            };
          }
        })
      );

      setAuthors(authorsWithStats);
    } catch (err: any) {
      setError(err.message || "Failed to load authors");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAuthor = () => {
    setAuthorName("");
    setAddAuthorModalOpen(true);
  };

  // Edit author details
  const handleEditAuthor = (author: AuthorWithStats) => {
    setSelectedAuthor(author);
    setAuthorName(author.name);
    setEditAuthorModalOpen(true);
  };

  // Delete author confirmation
  const handleDeleteAuthor = (author: AuthorWithStats) => {
    setSelectedAuthor(author);
    setDeleteConfirmOpen(true);
  };

  // Register new author
  const submitAddAuthor = async () => {
    if (!authorName.trim()) {
      setError("Author name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createAuthor(authorName.trim());

      setSuccess(`Author "${authorName}" created successfully!`);
      setAddAuthorModalOpen(false);
      setAuthorName("");
      loadAuthors(searchQuery);
    } catch (err: any) {
      setError(err.message || "Failed to create author");
    } finally {
      setLoading(false);
    }
  };

  // Update existing author
  const submitEditAuthor = async () => {
    if (!selectedAuthor || !authorName.trim()) {
      setError("Author name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await updateAuthor(selectedAuthor.id, authorName.trim());

      setSuccess(`Author updated to "${authorName}" successfully!`);
      setEditAuthorModalOpen(false);
      loadAuthors(searchQuery);
    } catch (err: any) {
      setError(err.message || "Failed to update author");
    } finally {
      setLoading(false);
    }
  };

  // Confirm delete author
  const confirmDeleteAuthor = async () => {
    if (!selectedAuthor) return;

    try {
      setLoading(true);
      setError(null);

      await deleteAuthor(selectedAuthor.id);

      setSuccess(`Author "${selectedAuthor.name}" deleted successfully!`);
      setDeleteConfirmOpen(false);
      loadAuthors(searchQuery);
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to delete author. This author may have books associated."
      );
    } finally {
      setLoading(false);
    }
  };

  // Authors Table
  const ActionsRenderer = (props: any) => {
    const author: AuthorWithStats = props.data;
    const hasBooks = author.totalBooks > DefaultZero;

    return (
      <Box sx={{ display: "flex", gap: 1 }}>
        <Tooltip title="Edit Author">
          <IconButton
            size="small"
            color="info"
            onClick={() => handleEditAuthor(author)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip
          title={hasBooks ? "Cannot delete: Author has books" : "Delete Author"}
        >
          <span>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteAuthor(author)}
              disabled={hasBooks}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    );
  };

  const columnDefs: ColDef[] = [
    { field: "id", headerName: "ID", width: 100, sortable: true },
    {
      field: "name",
      headerName: "Name",
      width: 300,
      sortable: true,
      filter: true,
    },
    {
      field: "totalBooks",
      headerName: "Total Books",
      width: 150,
      sortable: true,
      cellRenderer: (params: any) => (
        <Chip
          label={params.value}
          color={params.value > 0 ? "primary" : "default"}
          size="small"
          icon={<BookIcon />}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
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
            <PersonIcon fontSize="large" /> Author Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage author records and their books
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAuthor}
          sx={{
            background: "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
            color: "white",
            "&:hover": {
              background: "linear-gradient(45deg, #1565c0 30%, #1976d2 90%)",
            },
          }}
        >
          Add New Author
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
          placeholder="Search authors by name..."
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
        {loading && authors.length === 0 ? (
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
        ) : authors.length === 0 ? (
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
                ? "No authors found matching your search"
                : "No authors available"}
            </Typography>
          </Box>
        ) : (
          <AgGridReact
            rowData={authors}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={15}
            domLayout="normal"
          />
        )}
      </Paper>

      <Dialog
        open={addAuthorModalOpen}
        onClose={() => setAddAuthorModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#1976d2", color: "white" }}>
          <Typography variant="h6">Add New Author</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, mt:5 }}>
          <TextField
            fullWidth
            label="Author Name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Enter author name..."
            autoFocus
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddAuthorModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitAddAuthor}
            disabled={!authorName.trim() || loading}
          >
            {loading ? <CircularProgress size={24} /> : "Create Author"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editAuthorModalOpen}
        onClose={() => setEditAuthorModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#1976d2", color: "white" }}>
          <Typography variant="h6">Edit Author</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Author Name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Enter author name..."
            autoFocus
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditAuthorModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitEditAuthor}
            disabled={!authorName.trim() || loading}
          >
            {loading ? <CircularProgress size={24} /> : "Update Author"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          {selectedAuthor && selectedAuthor.totalBooks > 0 ? (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Cannot delete this author!
                </Typography>
              </Alert>
              <Typography>
                Author "<strong>{selectedAuthor.name}</strong>" has{" "}
                <strong>{selectedAuthor.totalBooks}</strong> book(s) associated.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Please delete or reassign all books before deleting this author.
              </Typography>
            </>
          ) : (
            <Typography>
              Are you sure you want to delete the author "
              <strong>{selectedAuthor?.name}</strong>"?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            {selectedAuthor && selectedAuthor.totalBooks > 0
              ? "Close"
              : "Cancel"}
          </Button>
          {selectedAuthor && selectedAuthor.totalBooks === 0 && (
            <Button
              variant="contained"
              color="error"
              onClick={confirmDeleteAuthor}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Delete"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuthorManagement;
