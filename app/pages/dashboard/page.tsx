"use client"
import { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { useRouter } from 'next/navigation';

interface Repository {
  id: number;
  name: string;
}

const HomePage = () => {
  const [username, setUsername] = useState('');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchRepositories = useCallback(async (user: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN; // Store token in .env file
      const response = await fetch(`https://api.github.com/users/${user}/repos`, {
        headers: {
          Authorization: `token ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }
      const data: Repository[] = await response.json();
      setRepositories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);
  

  const debouncedFetch = useCallback(
    debounce((user: string) => {
      if (user) {
        fetchRepositories(user);
      } else {
        setRepositories([]);
      }
    }, 500),
    [fetchRepositories]
  );

  useEffect(() => {
    debouncedFetch(username);
    // Cleanup function to cancel the debounce on unmount
    return () => debouncedFetch.cancel();
  }, [username, debouncedFetch]);

  const handleNext = () => {
    if (username && selectedRepo) {
      router.push(`/repo/${username}/${selectedRepo}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#14194D]">
      <div className="w-full max-w-lg p-8 bg-[#1D2057] rounded-lg shadow-lg">
        <div className="mb-4">
          <label className="block  text-lg font-medium mb-2">
            Enter GitHub username:
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 bg-[#0F1239]  border border-[#31356E] rounded-md focus:outline-none focus:border-[#5F60E7]"
            placeholder="Enter username"
          />
        </div>

        {loading && <p className="">Loading repositories...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {repositories.length > 0 && (
          <div className="mb-4">
            <label className="block  text-lg font-medium mb-2">
              Select a repository:
            </label>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500  font-medium border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-pink-600"
            >
              <option value="" disabled>
                Select a repository
              </option>
              {repositories.map((repo) => (
                <option key={repo.id} value={repo.name}>
                  {repo.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedRepo && (
          <button
            onClick={handleNext}
            className="mt-4 px-4 py-2 bg-blue-500  rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default HomePage;