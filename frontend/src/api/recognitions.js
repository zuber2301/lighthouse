// Recognition API helpers (converted to JS)

export async function fetchRecognitions() {
  try {
    const res = await fetch('/api/recognitions')
    if (!res.ok) throw new Error(res.statusText)
    return await res.json()
  } catch (e) {
    // Fallback to empty list when backend isn't available during local dev
    return []
  }
}

export async function createRecognition(payload) {
  const res = await fetch('/api/recognitions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  return await res.json()
} 
