import express from "express"
import { validateMovies, validatePartialMovie } from "./schemas/moviesSh.js"
import crypto from "node:crypto"
import movies from "./movies.json" assert { type: "json" }
import cors from 'cors'
const app = express()

app.use(express.json())
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:3500',
      'http://localhost:1234',
      'http://localhost:8080',
      'https://midu.dev'
  ]
  if(ACCEPTED_ORIGINS.includes(origin) || !origin){
    return callback(null, true)
  }
  return callback(new Error('Not allowed by CORS'))
  }
}))
app.disable("x-powered-by")

app.get("/", (req, res) => {
  res.json({ message: "Hola-Mundo" })
})

app.get("/movies", (req, res) => {
  const { genre } = req.query
  const { rate } = req.query
  if (genre && rate) {
    const filteredMovies = movies.filter(
      (movie) =>
        movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase()) &&
        movie.rate >= rate
    )
    return res.json(filteredMovies)
  }
  res.json(movies)
})
app.get("/movies/:id", (req, res) => {
  const { id } = req.params
  const movie = movies.find((movie) => movie.id === id)
  if (movie) return res.json(movie)
  res.status(404).json({ message: "movie not found" })
})

app.post("/movies", (req, res) => {
  const result = validateMovies(req.body)
  console.log(result)
  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }
  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data,
  }
  //simulacion de base de datos,!esto no seria rest API¡
  movies.push(newMovie)
  res.status(201).json(newMovie) //actualizar cache del cliente
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if(movieIndex === -1) {
    return res.status(404).json({message: 'movie nos found'})
  }

  movies.splice(movieIndex, 1)
  return res.json({message: 'Movie deleted'})
})

app.patch("/movies/:id", (req, res) => {
  const result = validatePartialMovie(req.body)

  if(!result.success){
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if(movieIndex === -1) return res.status(404).json({message: 'movie not found'})
  const updateMovie = { 
    ...movies[movieIndex],
    ...result.data
  }
  movies[movieIndex] = updateMovie
  res.status(201).json(movies[movieIndex])
})

const PORT = process.env.PORT ?? 3500

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`)
})
