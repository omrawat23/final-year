'use client'

import { useParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { FolderIcon, FileIcon, ArrowLeftIcon, Loader2Icon, SendIcon, GithubIcon, UserIcon, BotIcon } from 'lucide-react'
import { useGitHubData } from '@/hooks/useGithubData'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'

export default function ChatWithRepo() {
  const params = useParams()
  const username = Array.isArray(params?.username) ? params?.username[0] : params?.username
  const repo = Array.isArray(params?.repo) ? params?.repo[0] : params?.repo

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

  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'ai' }[]>([
    { text: "Hi! I'm here to help you understand the code in this repository. What would you like to know?", sender: 'ai' },
  ])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  const handleItemClick = (item: { type: string; path: string }) => {
    if (item.type === 'dir') {
      setCurrentPath(item.path)
    } else if (item.type === 'file') {
      setSelectedFile(item.path)
      fetchFileContent(item.path)
      setMessages(prev => [...prev, { text: `You've selected the file: ${item.path}. What would you like to know about it?`, sender: 'ai' }])
    }
  }

  const handleBackClick = () => {
    const newPath = currentPath.split('/').slice(0, -1).join('/')
    setCurrentPath(newPath)
  }

  const handleSend = async () => {
    if (input.trim()) {
      setMessages(prev => [...prev, { text: input, sender: 'user' }])
      setInput('')
      setChatLoading(true)
      try {
        const response = await fetch('/api/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: input,
            username,
            repo,
            selectedFile,
          }),
        })
        if (!response.ok) {
          throw new Error('Failed to get response')
        }
        const data = await response.json()
        setMessages(prev => [...prev, { text: data.message, sender: 'ai' }])
      } catch (err) {
        console.error(err)
        setMessages(prev => [...prev, { text: 'Sorry, I encountered an error while processing your request.', sender: 'ai' }])
      } finally {
        setChatLoading(false)
      }
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#e0d4cc]">
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
      <h1 className="text-3xl font-bold text-primary flex items-center">
        <GithubIcon className="mr-2 h-8 w-8" />
        Chat with {repo}
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 outline-black outline">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              File Explorer
              {currentPath && (
                <Button variant="outline" size="icon" onClick={handleBackClick} aria-label="Go back" className="outline-black outline">
                  <ArrowLeftIcon className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-[calc(100vh-300px)]">
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
            <CardTitle>Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-[calc(100vh-300px)] border-black">
            <ScrollArea className="flex-grow mb-4 pr-4 border-black">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-[80%] ${
                      msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.sender === 'user' ? 'bg-primary' : 'bg-secondary'
                    }`}>
                      {msg.sender === 'user' ? (
                        <UserIcon className="w-5 h-5 text-primary-foreground" />
                      ) : (
                        <BotIcon className="w-5 h-5 text-secondary-foreground" />
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </ScrollArea>
            <div className="flex items-center space-x-2 border-black">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-grow outline-black outline"
              />
              <Button onClick={handleSend} disabled={chatLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {chatLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
