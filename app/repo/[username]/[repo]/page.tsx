'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { FolderIcon, FileIcon, ArrowLeftIcon, Loader2Icon, GithubIcon } from 'lucide-react'
import { useGitHubData } from '@/hooks/useGithubData'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function RepoPage() {
  const params = useParams()
  const username = Array.isArray(params?.username) ? params?.username[0] : params?.username
  const repo = Array.isArray(params?.repo) ? params?.repo[0] : params?.repo
  const router = useRouter()

  const {
    contents,
    currentPath,
    selectedFile,
    fileContent,
    loading,
    error,
    setCurrentPath,
    setSelectedFile,
    fetchFileContent,
  } = useGitHubData(username!, repo!)

  const [buttonLoading, setButtonLoading] = useState(false)

  const handleItemClick = (item: { type: string; path: string }) => {
    if (item.type === 'dir') {
      setCurrentPath(item.path)
    } else if (item.type === 'file') {
      setSelectedFile(item.path)
      fetchFileContent(item.path)
    }
  }

  const handleBackClick = () => {
    const newPath = currentPath.split('/').slice(0, -1).join('/')
    setCurrentPath(newPath)
  }

  const handleTalkToCode = async () => {
    try {
      setButtonLoading(true)
      const response = await fetch('/api/parse-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          repo
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process repository')
      }
      const data = await response.json()
      alert(data.message || 'Successfully processed repository!')
      router.push(`/pages/chat/${username}/${repo}`)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setButtonLoading(false)
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#e0d4cc] outline-black outline">
        <Card className="w-[350px] outline-black outline">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6 mt-8 bg-[#e0d4cc] outline-black outline">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <GithubIcon className="mr-2 h-8 w-8" />
          {repo}
        </h1>
        <Button
          onClick={handleTalkToCode}
          disabled={buttonLoading}
         
        >
          <span> {buttonLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
          Talk to Code</span>
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 outline-black outline">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              File Explorer
              {currentPath && (
                <Button size="icon" onClick={handleBackClick} aria-label="Go back"  className="bg-primary text-primary-foreground hover:bg-primary/90 outline-black ">
                  <ArrowLeftIcon className="h-4 w-4 ml-[-8px] mt-[-1px]" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-[50vh]">
                <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)] outline-black outline">
                <ul className="space-y-1">
                  {contents.map((item) => (
                    <li key={item.sha}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-accent hover:text-accent-foreground outline-black outline"
                        onClick={() => handleItemClick(item)}
                      >
                        <span className="flex items-center">
                          {item.type === 'dir' ? (
                            <FolderIcon className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
                          ) : (
                            <FileIcon className="mr-2 h-4 w-4 flex-shrink-0 text-secondary" />
                          )}
                          <span className="truncate">{item.name}</span>
                        </span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 outline-black outline">
          <CardHeader>
            <CardTitle>{selectedFile || 'File Content'}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedFile && fileContent ? (
              <ScrollArea className="h-[calc(100vh-300px)] outline-black outline">
                <pre className="p-4 bg-muted rounded-md overflow-x-auto ">
                  <code>{fileContent}</code>
                </pre>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-[calc(100vh-300px)] text-muted-foreground">
                <p>Select a file to view its content</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
