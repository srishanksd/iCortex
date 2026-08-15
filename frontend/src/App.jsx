import { Show, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/react'
import { useEffect, useRef } from 'react'

import './App.css'

function App() {
  const { isSignedIn, getToken } = useAuth()
  const hasSynced = useRef(false)

  useEffect(() => {
    if (!isSignedIn || hasSynced.current) return
    hasSynced.current = true

    async function syncUser() {
      try {
        const token = await getToken()
        const apiUrl = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3000' : '')
        const response = await fetch(`${apiUrl}/api/webhooks/clerk/sync`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error(`Sync failed with status ${response.status}`)
      } catch (error) {
        hasSynced.current = false
        console.error('Could not sync the Clerk user to MongoDB', error)
      }
    }

    syncUser()
  }, [getToken, isSignedIn])

  return (
    <>
      <div>
        <h1>iCortex</h1>

        <header>
            <Show when="signed-out">
              <SignInButton mode = "modal"/>
              <SignUpButton mode = "modal"/>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
        </header>
        
      </div>
    </>
  )
}

export default App
