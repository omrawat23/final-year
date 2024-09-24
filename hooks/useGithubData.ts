import { useState, useEffect } from 'react'

interface RepoContent {
  name: string
  type: string
  path: string
  sha: string
}

interface FileContent {
  content: string
}

export function useGitHubData(username: string, repo: string) {
  const [contents, setContents] = useState<RepoContent[]>([])
  const [currentPath, setCurrentPath] = useState('')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRepoContents = async (path: string) => {
    setLoading(true)
    setError(null)
    try {
      const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN
      const response = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${path}`, {
        headers: {
          Authorization: `token ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch repository contents')
      }
      const data: RepoContent[] = await response.json()
      setContents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (username && repo) {
      fetchRepoContents(currentPath)
    }
  }, [username, repo, currentPath])

  const fetchFileContent = async (path: string) => {
    setLoading(true)
    setError(null)
    try {
      const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN
      const response = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${path}`, {
        headers: {
          Authorization: `token ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch file content')
      }
      const data: FileContent = await response.json()
      setFileContent(atob(data.content)) // Decode base64 content
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return {
    contents,
    currentPath,
    selectedFile,
    fileContent,
    loading,
    error,
    setCurrentPath,
    setSelectedFile,
    fetchFileContent,
    fetchRepoContents, 
  }
}