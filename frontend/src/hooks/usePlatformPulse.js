import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export default function usePlatformPulse() {
  const [events, setEvents] = useState([])
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
    const s = io(backendUrl, {
      path: '/ws/socket.io'
    })

    s.on('connect', () => console.log('Pulse Connected'))
    
    s.on('tenant_created', (data) => {
      setEvents(prev => [{ ...data, type: 'provision', timestamp: new Date() }, ...prev].slice(0, 50))
    })

    s.on('budget_loaded', (data) => {
      setEvents(prev => [{ ...data, type: 'budget', timestamp: new Date() }, ...prev].slice(0, 50))
    })

    setSocket(s)
    return () => s.disconnect()
  }, [])

  return { events }
}
