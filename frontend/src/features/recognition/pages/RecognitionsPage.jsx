import React from 'react'
import { useRecognitions } from '../hooks'
import RecognitionList from '../components/RecognitionList'
import CreateRecognitionForm from '../components/CreateRecognitionForm'

export default function RecognitionsPage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useRecognitions()

  const pages = data?.pages ?? []

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Recognitions</h2>
      <CreateRecognitionForm />
      {status === 'loading' && <div>Loading...</div>}
      {status === 'error' && <div>Error loading recognitions</div>}
      {status === 'success' && (
        <RecognitionList
          pages={pages}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      )}
    </div>
  )
}
