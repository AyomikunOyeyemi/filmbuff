import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [movies, setMovies] = useState([])
  const [title, setTitle] = useState('')
  // Holds a user-facing message when something goes wrong (e.g. duplicate title)
  const [errorMessage, setErrorMessage] = useState('')

  // Fetch movies from database
  async function fetchMovies() {
    const { data, error } = await supabase.from('movies').select('*')
    if (error) console.error('Fetch Error:', error)
    else setMovies(data)
  }

  useEffect(() => {
    fetchMovies()
  }, [])

  // Turn "inception" / "the dark knight" into "Inception" / "The Dark Knight"
  function toTitleCase(text) {
    return text
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Add movie to database
  async function addMovie(e) {
    e.preventDefault()
    setErrorMessage('') // Clear any previous error before trying again

    if (!title.trim()) return

    const formattedTitle = toTitleCase(title)

    const { error } = await supabase.from('movies').insert([{ title: formattedTitle }])

    if (error) {
      // 23505 = PostgreSQL unique constraint violation (from Phase 2 Step 1)
      if (error.code === '23505') {
        setErrorMessage(`"${formattedTitle}" is already on your watchlist!`)
      } else {
        setErrorMessage('Failed to add movie. Please try again.')
        console.error('Add Error:', error)
      }
    } else {
      setTitle('')
      fetchMovies() // Refresh list
    }
  }

  // Phase 3: delete from Supabase, then update local state without a full re-fetch
  async function deleteMovie(id) {
    // .eq('id', id) means: only delete the row whose id matches this one
    const { error } = await supabase.from('movies').delete().eq('id', id)

    if (error) {
      console.error('Delete error:', error)
      setErrorMessage('Failed to delete movie.')
    } else {
      // Optimistic UI: remove it from React state immediately
      // (no need to call fetchMovies() again for a smoother experience)
      setMovies((prevMovies) => prevMovies.filter((movie) => movie.id !== id))
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h1>FilmBuff</h1>
      <form onSubmit={addMovie} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter movie title..."
          style={{ flex: 1, padding: '8px' }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Add Movie</button>
      </form>

      {/* Only render this paragraph when errorMessage is not empty */}
      {errorMessage && (
        <p style={{ color: 'red', fontSize: '14px' }}>{errorMessage}</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {movies.map((movie) => (
          <li
            key={movie.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid #ccc',
            }}
          >
            <span>{movie.title}</span>
            <button
              type="button"
              onClick={() => deleteMovie(movie.id)}
              style={{
                color: 'white',
                backgroundColor: '#e53e3e',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
