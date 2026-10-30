
import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || undefined,
  database: process.env.DB_NAME,
});

// Database connection
pool.connect()
  .then((client) => {
    console.log("PostgreSQL connected successfully!");
    client.release();
  })
  .catch((error) => {
    console.error("Database connection error:", error.message);
  });

// Test API
app.get("/", (req, res) => {
  res.send("Movie Management API is running!");
});

// Get all movies
app.get("/api/movies", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM movies ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add movie
app.post("/api/movies", async (req, res) => {
  try {
    const {
      title, genre, year, description,
      poster, rating, favorite
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const result = await pool.query(
      `INSERT INTO movies
      (title, genre, year, description, poster, rating, favorite)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        title.trim(),
        genre || "",
        year ? Number(year) : null,
        description || "",
        poster || "",
        rating ?? 0,
        favorite ?? false
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit movie
app.put("/api/movies/:id", async (req, res) => {
  try {
    const {
      title, genre, year, description,
      poster, rating, favorite
    } = req.body;

    const result = await pool.query(
      `UPDATE movies
       SET title=$1, genre=$2, year=$3,
           description=$4, poster=$5,
           rating=$6, favorite=$7
       WHERE id=$8
       RETURNING *`,
      [
        title,
        genre || "",
        year ? Number(year) : null,
        description || "",
        poster || "",
        rating ?? 0,
        favorite ?? false,
        req.params.id
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete movie
app.delete("/api/movies/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM movies WHERE id=$1 RETURNING *",
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.json({ message: "Movie deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
