
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Rating,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type Movie = {
  id: number;
  title: string;
  genre: string;
  year: number | string;
  description: string;
  poster: string;
  rating: number;
  favorite: boolean;
};

type MovieForm = {
  title: string;
  genre: string;
  year: string;
  description: string;
  poster: string;
  rating: number;
  favorite: boolean;
};

const API_URL = "http://localhost:5000/api/movies";

const emptyForm: MovieForm = {
  title: "",
  genre: "",
  year: "",
  description: "",
  poster: "",
  rating: 0,
  favorite: false,
};

const genres = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Thriller",
];

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [form, setForm] = useState<MovieForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Get movies from PostgreSQL through Express API
  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to load movies.");
      }

      const data = await response.json();
      setMovies(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  // Dashboard statistics
  const totalMovies = movies.length;

  const favoriteCount = movies.filter(
    (movie) => movie.favorite
  ).length;

  const averageRating =
    movies.length > 0
      ? (
          movies.reduce((sum, movie) => sum + movie.rating, 0) /
          movies.length
        ).toFixed(1)
      : "0.0";

  const genreCount = new Set(
    movies.map((movie) => movie.genre).filter(Boolean)
  ).size;

  // Search, filter and sort
  const filteredMovies = useMemo(() => {
    let result = [...movies];

    if (search.trim()) {
      result = result.filter((movie) =>
        movie.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedGenre !== "All") {
      result = result.filter(
        (movie) => movie.genre === selectedGenre
      );
    }

    if (sortBy === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "year") {
      result.sort(
        (a, b) => Number(b.year || 0) - Number(a.year || 0)
      );
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else {
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [movies, search, selectedGenre, sortBy]);

  // Open add dialog
  const handleAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpenDialog(true);
    setError("");
  };

  // Open edit dialog
  const handleEdit = (movie: Movie) => {
    setEditingId(movie.id);

    setForm({
      title: movie.title,
      genre: movie.genre || "",
      year: String(movie.year || ""),
      description: movie.description || "",
      poster: movie.poster || "",
      rating: movie.rating || 0,
      favorite: movie.favorite || false,
    });

    setOpenDialog(true);
    setError("");
  };

  // Save movie
  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("Please enter a movie title.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const method = editingId ? "PUT" : "POST";

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          year: form.year ? Number(form.year) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save movie.");
      }

      await fetchMovies();
      setOpenDialog(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Save failed."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete movie
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this movie?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete movie.");
      }

      await fetchMovies();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Delete failed."
      );
    }
  };

  // Toggle favorite
  const handleFavorite = async (movie: Movie) => {
    try {
      const response = await fetch(`${API_URL}/${movie.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...movie,
          favorite: !movie.favorite,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not update favorite.");
      }

      await fetchMovies();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Favorite update failed."
      );
    }
  };

  const updateForm = <K extends keyof MovieForm,>(
    field: K,
    value: MovieForm[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F8F6F0",
        color: "#354536",
        py: 5,
        px: { xs: 2, md: 5 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Header */}
        <Stack
  direction={{ xs: "column", sm: "row" }}
  spacing={2}
  sx={{
    alignItems: { xs: "flex-start", sm: "center" },
    justifyContent: "space-between",
    mb: 5,
  }}
>
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, letterSpacing: -1 }}
            >
              My Movie Collection
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Manage your favorite movies in one place.
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={handleAdd}
            sx={{
              bgcolor: "#354536",
              borderRadius: 3,
              px: 3,
              py: 1.3,
              "&:hover": { bgcolor: "#263729" },
            }}
          >
            + Add Movie
          </Button>
        </Stack>

        {/* Error message */}
        {error && (
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {/* Dashboard */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
            mb: 5,
          }}
        >
          {[
            { label: "Total Movies", value: totalMovies },
            { label: "Favorites", value: favoriteCount },
            { label: "Average Rating", value: averageRating },
            { label: "Genres", value: genreCount },
          ].map((item) => (
            <Paper
              key={item.label}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                bgcolor: "#FFFFFF",
                border: "1px solid #E9E6DC",
              }}
            >
              <Typography color="text.secondary" variant="body2">
                {item.label}
              </Typography>

              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                {item.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Search and filters */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <TextField
            fullWidth
            placeholder="Search movies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ bgcolor: "white", borderRadius: 2 }}
          />

          <FormControl sx={{ minWidth: 160, bgcolor: "white" }}>
            <InputLabel>Genre</InputLabel>
            <Select
              value={selectedGenre}
              label="Genre"
              onChange={(e) => setSelectedGenre(e.target.value)}
            >
              <MenuItem value="All">All Genres</MenuItem>
              {genres.map((genre) => (
                <MenuItem key={genre} value={genre}>
                  {genre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 160, bgcolor: "white" }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="newest">Recently Added</MenuItem>
              <MenuItem value="title">Title</MenuItem>
              <MenuItem value="year">Year</MenuItem>
              <MenuItem value="rating">Rating</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Movie list */}
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
          My Movies ({filteredMovies.length})
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#354536" }} />
          </Box>
        ) : filteredMovies.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: 4,
              bgcolor: "white",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              No movies found
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Add a movie or change your search filters.
            </Typography>
          </Paper>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            {filteredMovies.map((movie) => (
              <Card
                key={movie.id}
                elevation={0}
                sx={{
                  borderRadius: 4,
                  overflow: "hidden",
                  border: "1px solid #E9E6DC",
                  bgcolor: "white",
                }}
              >
                {movie.poster ? (
                  <Box
                    component="img"
                    src={movie.poster}
                    alt={movie.title}
                    sx={{
                      width: "100%",
                      height: 280,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 280,
                      bgcolor: "#E9E6DC",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography color="text.secondary">
                      No poster available
                    </Typography>
                  </Box>
                )}

                <CardContent sx={{ p: 3 }}>
                  <Stack
  direction="row"
  spacing={1}
  sx={{
    alignItems: "flex-start",
    justifyContent: "space-between",
  }}
>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {movie.title}
                      </Typography>

                      <Typography color="text.secondary" variant="body2">
                        {movie.year || "Year unknown"}
                      </Typography>
                    </Box>

                    <Button
                      onClick={() => handleFavorite(movie)}
                      color="inherit"
                      sx={{
                        minWidth: 40,
                        fontSize: 22,
                        color: movie.favorite ? "#D97757" : "#A7A7A0",
                      }}
                    >
                      {movie.favorite ? "♥" : "♡"}
                    </Button>
                  </Stack>

                  <Box sx={{ mt: 2, mb: 1 }}>
                    <Chip
                      label={movie.genre || "Other"}
                      size="small"
                      sx={{
                        bgcolor: "#E9EFE5",
                        color: "#354536",
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  <Rating
                    value={movie.rating}
                    readOnly
                    size="small"
                  />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 2,
                      minHeight: 45,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {movie.description || "No description."}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Stack direction="row" spacing={1}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleEdit(movie)}
                      sx={{
                        color: "#354536",
                        borderColor: "#354536",
                        borderRadius: 2,
                      }}
                    >
                      Edit
                    </Button>

                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() => handleDelete(movie.id)}
                      sx={{ borderRadius: 2 }}
                    >
                      Delete
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Add / Edit Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => !saving && setOpenDialog(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            {editingId ? "Edit Movie" : "Add New Movie"}
          </DialogTitle>

          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Movie Title"
                fullWidth
                required
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
              />

              <FormControl fullWidth>
                <InputLabel>Genre</InputLabel>
                <Select
                  value={form.genre}
                  label="Genre"
                  onChange={(e) => updateForm("genre", e.target.value)}
                >
                  {genres.map((genre) => (
                    <MenuItem key={genre} value={genre}>
                      {genre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Release Year"
                type="number"
                fullWidth
                value={form.year}
                onChange={(e) => updateForm("year", e.target.value)}
              />

              <TextField
                label="Poster Image URL"
                fullWidth
                value={form.poster}
                onChange={(e) => updateForm("poster", e.target.value)}
              />

              <TextField
                label="Description"
                multiline
                rows={3}
                fullWidth
                value={form.description}
                onChange={(e) =>
                  updateForm("description", e.target.value)
                }
              />

              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  Rating
                </Typography>
                <Rating
                  value={form.rating}
                  onChange={(_, value) =>
                    updateForm("rating", value || 0)
                  }
                />
              </Box>

              <Button
                variant={form.favorite ? "contained" : "outlined"}
                onClick={() =>
                  updateForm("favorite", !form.favorite)
                }
                sx={{
                  alignSelf: "flex-start",
                  bgcolor: form.favorite ? "#354536" : "transparent",
                  color: form.favorite ? "white" : "#354536",
                  borderColor: "#354536",
                  "&:hover": {
                    bgcolor: form.favorite ? "#263729" : "#E9EFE5",
                  },
                }}
              >
                {form.favorite ? "♥ Favorite" : "♡ Add to Favorites"}
              </Button>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={() => setOpenDialog(false)}
              disabled={saving}
              color="inherit"
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{
                bgcolor: "#354536",
                "&:hover": { bgcolor: "#263729" },
              }}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Movie"
                : "Add Movie"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

