import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import {
  Search as SearchIcon,
  MenuBook as BookIcon,
  Person as AuthorIcon,
} from "@mui/icons-material";
import { searchBooksByTitle, searchBooksByAuthorName } from "../api/queries";
import { Book } from "../utils/interfaces";

export default function SearchBooks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"title" | "author">("title");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Search books based on search type and term
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setError("Please enter a search term");
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    const searchPromise =
      searchType === "title"
        ? searchBooksByTitle(searchTerm)
        : searchBooksByAuthorName(searchTerm);

    searchPromise
      .then((data) => {
        setBooks(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to search books");
        setBooks([]);
        setLoading(false);
      });
  };

  // Handle Enter key press in search input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Search Books
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Search library catalog by book title or author name
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" flexDirection="column" gap={2}>
          <Box display="flex" justifyContent="center">
            <ToggleButtonGroup
              value={searchType}
              exclusive
              onChange={(_, value) => value && setSearchType(value)}
              aria-label="search type"
            >
              <ToggleButton value="title" aria-label="search by title">
                <BookIcon sx={{ mr: 1 }} />
                Search by Title
              </ToggleButton>
              <ToggleButton value="author" aria-label="search by author">
                <AuthorIcon sx={{ mr: 1 }} />
                Search by Author
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <TextField
            fullWidth
            placeholder={
              searchType === "title"
                ? "Enter book title..."
                : "Enter author name..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "background.paper",
              },
            }}
          />

          <Box display="flex" justifyContent="center">
            <Box
              component="button"
              onClick={handleSearch}
              disabled={loading}
              sx={{
                px: 4,
                py: 1.5,
                backgroundColor: "primary.main",
                color: "white",
                border: "none",
                borderRadius: 1,
                fontSize: "1rem",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor: "primary.dark",
                  transform: loading ? "none" : "translateY(-2px)",
                  boxShadow: loading ? "none" : 3,
                },
              }}
            >
              {loading ? "Searching..." : "Search"}
            </Box>
          </Box>
        </Box>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && searched && !error && (
        <>
          <Box mb={3}>
            <Typography variant="h6" fontWeight={600}>
              {books.length === 0
                ? "No books found"
                : `Found ${books.length} book${books.length === 1 ? "" : "s"}`}
            </Typography>
          </Box>

          {books.length > 0 && (
            <Grid container spacing={3}>
              {books.map((book) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
                  <Card
                    elevation={2}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        height: 220,
                        backgroundColor: "grey.200",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "4rem",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      📖
                    </Box>

                    <CardContent
                      sx={{
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Typography
                        variant="h6"
                        gutterBottom
                        fontWeight={600}
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          minHeight: "3.5rem",
                        }}
                      >
                        {book.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                        sx={{ mb: 2 }}
                      >
                        by {book.author?.name || "Unknown Author"}
                      </Typography>

                      <Box sx={{ mt: "auto" }}>
                        <Chip
                          label={`ISBN: ${book.isbn}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.75rem" }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {!loading && !searched && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
        >
          <SearchIcon sx={{ fontSize: 80, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Enter a search term to find books
          </Typography>
        </Box>
      )}
    </Box>
  );
}
