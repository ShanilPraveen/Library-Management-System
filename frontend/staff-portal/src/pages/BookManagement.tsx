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
  Autocomplete,
  Slider,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Book as BookIcon,
  CheckCircle as AvailableIcon,
  Error as DamagedIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
import { debounce } from "lodash";
import {
  searchBooksWithStats,
  searchAuthorsByName,
  getAllBookCopiesByBookId,
} from "../api/queries";
import {
  createBook,
  updateBook,
  deleteBook,
  createBookCopies,
  deleteBookCopy,
  markCopyAsDamaged,
  markCopyAsAvailable,
} from "../api/mutations";
import {
  Author,
  BookWithStats,
  BookCopy,
  BookFormData,
  LabelColor,
  LabelType,
} from "../utils/interfaces";
import { DefaultZero, DebounceDelay } from "../utils/constants";

ModuleRegistry.registerModules([AllCommunityModule]);

const BookManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<BookWithStats[]>([]);

  // Modals
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const [editBookModalOpen, setEditBookModalOpen] = useState(false);
  const [viewCopiesModalOpen, setViewCopiesModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Selected data
  const [selectedBook, setSelectedBook] = useState<BookWithStats | null>(null);
  const [bookCopies, setBookCopies] = useState<BookCopy[]>([]);

  // Form data
  const [formData, setFormData] = useState<BookFormData>({
    isbn: "",
    title: "",
    price: 0,
    authorId: 0,
    copiesCount: 1,
  });

  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [authorSearchQuery, setAuthorSearchQuery] = useState("");
  const [authorOptions, setAuthorOptions] = useState<Author[]>([]);
  const [authorLoading, setAuthorLoading] = useState(false);

  useEffect(() => {
    loadBooks("");
  }, []);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        loadBooks(query);
      }, DebounceDelay),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  // Debounced author search every 500ms
  const debouncedAuthorSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length < 2) {
          setAuthorOptions([]);
          return;
        }
        setAuthorLoading(true);
        try {
          const authors = await searchAuthorsByName(query);
          setAuthorOptions(authors);
        } catch (err) {
          console.error("Failed to search authors:", err);
        } finally {
          setAuthorLoading(false);
        }
      }, DebounceDelay),
    []
  );

  useEffect(() => {
    debouncedAuthorSearch(authorSearchQuery);
    return () => {
      debouncedAuthorSearch.cancel();
    };
  }, [authorSearchQuery, debouncedAuthorSearch]);

  // Load books with stats
  const loadBooks = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await searchBooksWithStats(query);
      setBooks(result);
    } catch (err: any) {
      setError(err.message || "Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  // Load book copies for selected book
  const loadBookCopies = async (bookId: number) => {
    try {
      const copies = await getAllBookCopiesByBookId(bookId);
      setBookCopies(copies);
    } catch (err: any) {
      setError(err.message || "Failed to load book copies");
    }
  };

  const handleAddBook = () => {
    setFormData({
      isbn: "",
      title: "",
      price: 0,
      authorId: 0,
      copiesCount: 1,
    });
    setSelectedAuthor(null);
    setAddBookModalOpen(true);
  };

  // Edit book details
  const handleEditBook = (book: BookWithStats) => {
    setSelectedBook(book);
    setFormData({
      isbn: book.isbn,
      title: book.title,
      price: book.price,
      authorId: book.authorId,
      copiesCount: 1,
    });
    setSelectedAuthor(book.author);
    setEditBookModalOpen(true);
  };

  // View book copies
  const handleViewCopies = async (book: BookWithStats) => {
    setSelectedBook(book);
    await loadBookCopies(book.id);
    setViewCopiesModalOpen(true);
  };

  // Delete book
  const handleDeleteBook = (book: BookWithStats) => {
    setSelectedBook(book);
    setDeleteConfirmOpen(true);
  };

  // register a new book with copies
  const submitAddBook = async () => {
    if (!selectedAuthor) {
      setError("Please select an author");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create book
      const newBook = await createBook({
        isbn: formData.isbn,
        title: formData.title,
        price: formData.price,
        authorId: selectedAuthor.id,
      });

      // Create copies
      if (formData.copiesCount > 0) {
        await createBookCopies(newBook.id, formData.copiesCount);
      }

      setSuccess(
        `Book "${newBook.title}" created with ${formData.copiesCount} copies!`
      );
      setAddBookModalOpen(false);
      loadBooks(searchQuery);
    } catch (err: any) {
      setError(err.message || "Failed to create book");
    } finally {
      setLoading(false);
    }
  };

  // Update book details
  const submitEditBook = async () => {
    if (!selectedBook || !selectedAuthor) return;

    try {
      setLoading(true);
      setError(null);

      await updateBook(selectedBook.id, {
        isbn: formData.isbn,
        title: formData.title,
        price: formData.price,
        authorId: selectedAuthor.id,
      });

      setSuccess(`Book "${formData.title}" updated successfully!`);
      setEditBookModalOpen(false);
      loadBooks(searchQuery);
    } catch (err: any) {
      setError(err.message || "Failed to update book");
    } finally {
      setLoading(false);
    }
  };

  // Confirm delete book
  const confirmDeleteBook = async () => {
    if (!selectedBook) return;

    try {
      setLoading(true);
      setError(null);

      await deleteBook(selectedBook.id);

      setSuccess(`Book "${selectedBook.title}" deleted successfully!`);
      setDeleteConfirmOpen(false);
      loadBooks(searchQuery);
    } catch (err: any) {
      setError(err.message || "Failed to delete book");
    } finally {
      setLoading(false);
    }
  };

  // Mark a book copy as damaged
  const handleMarkCopyAsDamaged = async (copyId: string) => {
    try {
      await markCopyAsDamaged(copyId);
      setSuccess("Copy marked as damaged");
      if (selectedBook) {
        await loadBookCopies(selectedBook.id);
        loadBooks(searchQuery);
      }
    } catch (err: any) {
      setError(err.message || "Failed to mark copy as damaged");
    }
  };

  // Mark a book copy as available
  const handleMarkCopyAsAvailable = async (copyId: string) => {
    try {
      await markCopyAsAvailable(copyId);
      setSuccess("Copy marked as available");
      if (selectedBook) {
        await loadBookCopies(selectedBook.id);
        loadBooks(searchQuery);
      }
    } catch (err: any) {
      setError(err.message || "Failed to mark copy as available");
    }
  };

  // Delete a book copy
  const handleDeleteCopy = async (copyId: string) => {
    if (!window.confirm("Are you sure you want to delete this copy?")) return;

    try {
      await deleteBookCopy(copyId);
      setSuccess("Copy deleted successfully");
      if (selectedBook) {
        await loadBookCopies(selectedBook.id);
        loadBooks(searchQuery);
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete copy");
    }
  };

  // Books Table
  const ActionsRenderer = (props: any) => {
    const book = props.data;
    return (
      <Box sx={{ display: "flex", gap: 1 }}>
        <Tooltip title="View Copies">
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleViewCopies(book)}
          >
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit Book">
          <IconButton
            size="small"
            color="info"
            onClick={() => handleEditBook(book)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Book">
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteBook(book)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  const columnDefs: ColDef[] = [
    { field: "id", headerName: "ID", width: 80, sortable: true },
    {
      field: "title",
      headerName: "Title",
      width: 250,
      sortable: true,
      filter: true,
    },
    {
      field: "author.name",
      headerName: "Author",
      width: 180,
      sortable: true,
      filter: true,
      valueGetter: (params) => params.data.author?.name || "Unknown",
    },
    { field: "isbn", headerName: "ISBN", width: 150, sortable: true },
    {
      field: "totalCopies",
      headerName: "Total Copies",
      width: 130,
      sortable: true,
    },
    {
      field: "availableCopies",
      headerName: "Available",
      width: 120,
      sortable: true,
      cellRenderer: (params: any) => (
        <Chip
          label={params.value}
          color={params.value > 0 ? "success" : "default"}
          size="small"
          icon={<AvailableIcon />}
        />
      ),
    },
    {
      field: "damagedCopies",
      headerName: "Damaged",
      width: 120,
      sortable: true,
      cellRenderer: (params: any) => (
        <Chip
          label={params.value}
          color={params.value > 0 ? "error" : "default"}
          size="small"
          icon={<DamagedIcon />}
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

  // Copies Table
  const CopyActionsRenderer = (props: any) => {
    const copy: BookCopy = props.data;
    return (
      <Box sx={{ display: "flex", gap: 1 }}>
        {copy.isDamaged && (
          <Tooltip title="Mark as Available">
            <IconButton
              size="small"
              color="success"
              onClick={() => handleMarkCopyAsAvailable(copy.id)}
            >
              <AvailableIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {!copy.isDamaged && copy.isAvailable && (
          <Tooltip title="Mark as Damaged">
            <IconButton
              size="small"
              color="warning"
              onClick={() => handleMarkCopyAsDamaged(copy.id)}
            >
              <DamagedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Delete Copy">
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteCopy(copy.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  const copyColumnDefs: ColDef[] = [
    { field: "id", headerName: "Copy ID", width: 200, sortable: true },
    {
      field: "isAvailable",
      headerName: "Status",
      width: 150,
      sortable: true,
      cellRenderer: (params: any) => {
        const copy: BookCopy = params.data;
        if (copy.isDamaged) {
          return (
            <Chip
              label="Damaged"
              color="error"
              size="small"
              icon={<DamagedIcon />}
            />
          );
        } else if (copy.isAvailable) {
          return (
            <Chip
              label="Available"
              color="success"
              size="small"
              icon={<AvailableIcon />}
            />
          );
        } else {
          return (
            <Chip
              label="Borrowed"
              color="warning"
              size="small"
              icon={<WarningIcon />}
            />
          );
        }
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      cellRenderer: CopyActionsRenderer,
      sortable: false,
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
            <BookIcon fontSize="large" /> Book Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage books, authors, and copies
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddBook}
          sx={{
            background: "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
            color: "white",
            "&:hover": {
              background: "linear-gradient(45deg, #1565c0 30%, #1976d2 90%)",
            },
          }}
        >
          Add New Book
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
          placeholder="Search by title or author name..."
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
        {loading && books.length === 0 ? (
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
        ) : books.length === 0 ? (
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
            <BookIcon sx={{ fontSize: 60, color: "#ccc" }} />
            <Typography variant="h6" color="text.secondary">
              {searchQuery
                ? "No books found matching your search"
                : "No books available"}
            </Typography>
          </Box>
        ) : (
          <AgGridReact
            rowData={books}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={10}
            domLayout="normal"
          />
        )}
      </Paper>

      <Dialog
        open={addBookModalOpen}
        onClose={() => setAddBookModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#1976d2", color: "white" }}>
          <Typography variant="h6">Add New Book</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="ISBN"
                value={formData.isbn}
                onChange={(e) =>
                  setFormData({ ...formData, isbn: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value),
                  })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">Rs</InputAdornment>
                  ),
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={authorOptions}
                getOptionLabel={(option) => option.name}
                value={selectedAuthor}
                onChange={(_, newValue) => setSelectedAuthor(newValue)}
                inputValue={authorSearchQuery}
                onInputChange={(_, newInputValue) =>
                  setAuthorSearchQuery(newInputValue)
                }
                loading={authorLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Author"
                    placeholder="Type to search authors..."
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {authorLoading ? (
                            <CircularProgress size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>
                Number of Copies: {formData.copiesCount}
              </Typography>
              <Slider
                value={formData.copiesCount}
                onChange={(_, value) =>
                  setFormData({ ...formData, copiesCount: value as number })
                }
                min={1}
                max={20}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddBookModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitAddBook}
            disabled={
              !formData.isbn || !formData.title || !selectedAuthor || loading
            }
          >
            {loading ? <CircularProgress size={24} /> : "Create Book"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editBookModalOpen}
        onClose={() => setEditBookModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#1976d2", color: "white" }}>
          <Typography variant="h6">Edit Book</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ISBN"
                value={formData.isbn}
                onChange={(e) =>
                  setFormData({ ...formData, isbn: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value),
                  })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={authorOptions}
                getOptionLabel={(option) => option.name}
                value={selectedAuthor}
                onChange={(_, newValue) => setSelectedAuthor(newValue)}
                inputValue={authorSearchQuery}
                onInputChange={(_, newInputValue) =>
                  setAuthorSearchQuery(newInputValue)
                }
                loading={authorLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Author"
                    placeholder="Type to search authors..."
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {authorLoading ? (
                            <CircularProgress size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditBookModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitEditBook}
            disabled={
              !formData.isbn || !formData.title || !selectedAuthor || loading
            }
          >
            {loading ? <CircularProgress size={24} /> : "Update Book"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={viewCopiesModalOpen}
        onClose={() => setViewCopiesModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#1976d2", color: "white" }}>
          <Typography variant="h6">
            Book Copies: {selectedBook?.title}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Total: {bookCopies.length} | Available:{" "}
            {bookCopies.filter((c) => c.isAvailable && !c.isDamaged).length} |
            Damaged: {bookCopies.filter((c) => c.isDamaged).length}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, height: 400 }}>
          {bookCopies.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Typography color="text.secondary">
                No copies found for this book
              </Typography>
            </Box>
          ) : (
            <Box sx={{ height: "100%", width: "100%" }}>
              <AgGridReact
                rowData={bookCopies}
                columnDefs={copyColumnDefs}
                defaultColDef={defaultColDef}
                domLayout="normal"
                enableCellTextSelection={true}
                ensureDomOrder={true}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewCopiesModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the book "
            <strong>{selectedBook?.title}</strong>"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            This will also delete all {selectedBook?.totalCopies} copies of this
            book!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeleteBook}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookManagement;
