"use client";

import Button from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaFolder, FaFile } from 'react-icons/fa';

interface RepoContent {
  name: string;
  type: string;
  path: string;
  sha: string;
}

interface FileContent {
  content: string;
}

const RepoPage = () => {
  const params = useParams();
const username = Array.isArray(params?.username) ? params?.username[0] : params?.username;
const repo = Array.isArray(params?.repo) ? params?.repo[0] : params?.repo;
  
  const [contents, setContents] = useState<RepoContent[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username && repo) {
      fetchRepoContents(currentPath);
    }
  }, [username, repo, currentPath]);

  const fetchRepoContents = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!username || !repo) {
        throw new Error('Username or repository is missing');
      }
  
      const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
      const response = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${path}`, {
        headers: {
          Authorization: `token ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch repository contents');
      }
      const data: RepoContent[] = await response.json();
      setContents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  

  const fetchFileContent = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
      const response = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${path}`, {
        headers: {
          Authorization: `token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch file content');
      }
      const data: FileContent = await response.json();
      setFileContent(atob(data.content)); // Decode base64 content
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: RepoContent) => {
    if (item.type === 'dir') {
      setCurrentPath(item.path);
    } else if (item.type === 'file') {
      setSelectedFile(item.path);
      fetchFileContent(item.path);
    }
  };
  
  const handleBackClick = () => {
    const newPath = currentPath.split('/').slice(0, -1).join('/');
    setCurrentPath(newPath);
  };

  const handleTalkToCode = async () => {
    console.log('Current values:', { username, repo });
  
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/parse-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          repo
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process repository');
      }
      const data = await response.json();
      alert(data.message || 'Successfully processed repository!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;

  return (
    <div className="container min-h-screen mx-auto p-4 flex flex-col justify-between mt-24">
      <div>
        <h1 className="text-2xl font-bold mb-4">Contents of {repo}</h1>
        <div className="flex">
          <div className="w-1/3 pr-4">
            {currentPath && (
              <button
                onClick={handleBackClick}
                className="mb-2 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Back
              </button>
            )}
            <ul className="border rounded">
              {contents.map((item) => (
                <li
                  key={item.sha}
                  className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                  onClick={() => handleItemClick(item)}
                >
                  {item.type === 'dir' ? <FaFolder className="mr-2" /> : <FaFile className="mr-2" />}
                  {item.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-2/3 pl-4">
            {selectedFile && fileContent && (
              <div>
                <h2 className="text-xl font-semibold mb-2">{selectedFile}</h2>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  {fileContent}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mb-64 mt-8">
        <Button
          onClick={handleTalkToCode}
          className="px-4 py-2 bg-blue-400 text-black rounded hover:bg-blue-500"
        >
          Talk to Code
        </Button>
      </div>
    </div>
  );
};

export default RepoPage;
