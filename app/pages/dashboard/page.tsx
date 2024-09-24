"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import debounce from 'lodash/debounce'
import { Loader2Icon, GithubIcon, SearchIcon, FolderIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Repository {
  id: number
  name: string
}

export default function Component() {
  const [username, setUsername] = useState('')
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [selectedRepo, setSelectedRepo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchRepositories = useCallback(async (user: string) => {
    setLoading(true)
    setError(null)
    try {
      const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN
      const response = await fetch(`https://api.github.com/users/${user}/repos`, {
        headers: {
          Authorization: `token ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch repositories')
      }
      const data: Repository[] = await response.json()
      setRepositories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  const debouncedFetch = useCallback(
    debounce((user: string) => {
      if (user) {
        fetchRepositories(user)
      } else {
        setRepositories([])
      }
    }, 500),
    [fetchRepositories]
  )

  useEffect(() => {
    debouncedFetch(username)
    return () => debouncedFetch.cancel()
  }, [username, debouncedFetch])

  const handleNext = () => {
    if (username && selectedRepo) {
      router.push(`/repo/${username}/${selectedRepo}`)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#e0d4cc] p-6">
      <Card className="w-full max-w-md shadow-xl outline-black outline">
        <CardHeader className="space-y-1 pb-8">
          <div className="flex items-center justify-center space-x-2">
            <GithubIcon className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-bold text-center">GitHub Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 ">
          <div className="space-y-2 ">
            <label htmlFor="username" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Enter Username
            </label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter GitHub username"
                className="pr-10 outline-black outline"
              />
              <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            </div>
          </div>
          
          {loading && (
            <div className="flex items-center justify-center space-x-2 text-muted-foreground py-4">
              <Loader2Icon className="h-5 w-5 animate-spin" />
              <span>Fetching repositories...</span>
            </div>
          )}
          
          {error && <p className="text-destructive text-center py-4">{error}</p>}
          
          {repositories.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="repo-select" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Select a Repository
              </label>
              <Select
                value={selectedRepo}
                onValueChange={(value) => setSelectedRepo(value)}
              >
                <SelectTrigger id="repo-select" className="w-full outline-black outline">
                  <SelectValue placeholder="Choose a repository" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px] mt-6 ">
                    {repositories.map((repo) => (
                      <SelectItem key={repo.id} value={repo.name}>
                        <div className="flex items-center space-x-2">
                          <FolderIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{repo.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {selectedRepo && (
            <Button 
              onClick={handleNext} 
              disabled={!username || !selectedRepo} 
              className="w-full mt-6"
            >
              Next
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}