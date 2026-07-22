# Movie Tracker App: Full-Stack Implementation Roadmap

A beginner-friendly, modular guide to building a real-time full-stack **Movie Tracker Application** using **React (Vite)** and **Supabase**. This roadmap is engineered to expose you to practical edge cases—such as database constraints, error handling, CORS, and state synchronization—giving you concrete engineering challenges to discuss during technical interviews.

---

## Technical Stack
- **Frontend:** React (JavaScript / Vite)
- **Backend / Database:** Supabase (PostgreSQL)
- **State Management:** React Native Hooks (`useState`, `useEffect`)

---

## Phase 1: Setup & Initial Database Connection
**Goal:** Initialize the React application, provision the Supabase backend table, connect the client via API keys, and successfully read/write basic data.

### Step 1: Initialize Your Projects
1. **Create React Project:** Open your terminal and set up a lightweight React app using Vite:
   ```bash
   npm create vite@latest movie-tracker -- --template react
   cd movie-tracker
   npm install
   ```
2. **Provision Supabase Project:**
   - Go to [Supabase](https://supabase.com) and create a free account.
   - Start a new project named `movie-tracker`.

### Step 2: Configure Database Table
1. In the Supabase Dashboard, navigate to **Table Editor** > **Create a new table**.
2. Name the table: `movies`.
3. Set up the schema:
   - `id`: `int8` (Primary Key, auto-generated / identity)
   - `title`: `text`
   - `status`: `text` (Default value: `'watchlist'`)
   - `created_at`: `timestamp` (Default value: `now()`)

### Step 3: Connect React to Supabase
1. Install the Supabase client SDK:
   ```bash
   npm install @supabase/supabase-js
   ```
2. Retrieve API credentials:
   - In Supabase, go to **Project Settings** > **API**.
   - Copy your **Project URL** and **anon / public key**.
3. Create `src/supabaseClient.js`:
   ```javascript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = 'YOUR_SUPABASE_URL'
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

### Step 4: Implement Basic CRUD Operations
Replace `src/App.jsx` with the following foundation:

```jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [movies, setMovies] = useState([])
  const [title, setTitle] = useState('')

  // Fetch movies from database
  async function fetchMovies() {
    const { data, error } = await supabase.from('movies').select('*')
    if (error) console.error('Fetch Error:', error)
    else setMovies(data)
  }

  useEffect(() => {
    fetchMovies()
  }, [])

  // Add movie to database
  async function addMovie(e) {
    e.preventDefault()
    if (!title.trim()) return

    const { error } = await supabase.from('movies').insert([{ title }])
    if (error) console.error('Add Error:', error)
    else {
      setTitle('')
      fetchMovies() // Refresh list
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h1>My Movie Watchlist</h1>
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
      <ul>
        {movies.map((m) => (
          <li key={m.id} style={{ marginBottom: '8px' }}>{m.title}</li>
        ))}
      </ul>
    </div>
  )
}

export default App
```

> ⚠️ **Common Bug / Edge Case:**
> If you receive permission errors or data fails to insert, check **Row Level Security (RLS)** in Supabase (**Table Editor** > **movies** > **RLS Policies**). For development, temporarily create an open access policy for `INSERT` and `SELECT` queries.

---

## Phase 2: Preventing Duplicates (Database Rules & Error Handling)
**Goal:** Enforce schema constraints in PostgreSQL to prevent duplicate movie titles and catch exception errors gracefully in the client interface.

### Step 1: Enforce Unique Constraints in PostgreSQL
1. Navigate to **SQL Editor** in Supabase.
2. Run the following DDL statement to enforce uniqueness on movie titles:
   ```sql
   ALTER TABLE movies ADD CONSTRAINT unique_movie_title UNIQUE (title);
   ```

### Step 2: Implement Client Error Handling
Update `addMovie` in `src/App.jsx` to intercept database constraint violations and notify the user without breaking application execution:

```jsx
const [errorMessage, setErrorMessage] = useState('')

async function addMovie(e) {
  e.preventDefault()
  setErrorMessage('') // Reset status

  if (!title.trim()) return

  const { error } = await supabase.from('movies').insert([{ title: title.trim() }])

  if (error) {
    // 23505 is the PostgreSQL error code for unique constraint violation
    if (error.code === '23505') {
      setErrorMessage(`"${title}" is already on your watchlist!`)
    } else {
      setErrorMessage('Failed to add movie. Please try again.')
      console.error('Add Error:', error)
    }
  } else {
    setTitle('')
    fetchMovies()
  }
}
```

Add error output below your input form:
```jsx
{errorMessage && <p style={{ color: 'red', fontSize: '14px' }}>{errorMessage}</p>}
```

---

## Phase 3: Deletions & State Synchronization
**Goal:** Delete movies from the database and synchronize local React state instantly without initiating full network re-fetches.

### Step 1: Write Optimistic Delete Logic
Add a delete handler in `src/App.jsx`:

```jsx
async function deleteMovie(id) {
  // Delete record from Supabase
  const { error } = await supabase.from('movies').delete().eq('id', id)

  if (error) {
    console.error('Delete error:', error)
    alert('Failed to delete movie.')
  } else {
    // Optimistically update local UI state immediately
    setMovies((prevMovies) => prevMovies.filter((movie) => movie.id !== id))
  }
}
```

### Step 2: Render Delete Actions in UI
Update the movie rendering list to include delete triggers:

```jsx
<ul style={{ listStyle: 'none', padding: 0 }}>
  {movies.map((movie) => (
    <li 
      key={movie.id} 
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '8px 0',
        borderBottom: '1px solid #ccc' 
      }}
    >
      <span>{movie.title}</span>
      <button 
        onClick={() => deleteMovie(movie.id)}
        style={{ color: 'white', backgroundColor: '#e53e3e', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
      >
        Delete
      </button>
    </li>
  ))}
</ul>
```

---

## Interview Talking Points (STAR Method)
When speaking with recruiters or engineers at events like **NSBE Career Fairs**, use this framework to articulate your project experience:

- **Situation:** Built a movie tracking application using React and Supabase.
- **Task:** Needed to maintain data consistency and provide a seamless, responsive user experience during async database modifications.
- **Action:** 
  1. Configured unique constraints at the PostgreSQL database level.
  2. Implemented client-side error handling to catch PostgreSQL exception codes (`23505`) and provide user feedback.
  3. Replaced full table re-fetching with optimistic local state filtering on deletions.
- **Result:** Reduced server payload overhead and eliminated asynchronous synchronization delay between database writes and the client UI.