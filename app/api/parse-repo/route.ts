"use server"
import { NextApiRequest, NextApiResponse } from 'next';
import { Octokit } from '@octokit/rest'; 
import axios from 'axios'; 
import { pc, index } from '../../../lib/pineconeClient';  // Use the imported 'index'
import { NextRequest, NextResponse } from 'next/server';

const model = 'text-embedding-3-large';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { username, repo } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }
    if (!repo) {
      return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
    }

    // Initialize Octokit
    const octokit = new Octokit({
      auth: process.env.NEXT_PUBLIC_GITHUB_TOKEN,
    });

    // Fetch the contents of the repository root
    const repoContents = await octokit.repos.getContent({
      owner: username,
      repo,
      path: '', // Fetch the contents of the root directory
    });

    const files = Array.isArray(repoContents.data) ? repoContents.data : [repoContents.data];
    const fileData: Array<{ id: string; text: string }> = [];

    // Process each file
    for (const file of files) {
      if (file.type === 'file') {
        const fileContent = await octokit.repos.getContent({
          owner: username,
          repo,
          path: file.path,
          mediaType: { format: 'raw' },
        });

        if (typeof fileContent.data === 'string') {
          fileData.push({
            id: file.sha,
            text: fileContent.data,
          });
        } else {
          console.warn(`File ${file.path} content is not a string.`);
        }
      }
    }

    // Generate embeddings
    const texts: string[] = fileData.map(d => d.text);
    const embeddings = await pc.inference.embed(
      model,
      texts,
      { inputType: 'passage', truncate: 'END' }
    );

    const vectors = fileData.map((d, i) => ({
      id: d.id,
      values: embeddings[i]?.values || [], // Ensure these match the index dimension
      metadata: { text: d.text, path: d.id },
    }));

    // Store vectors in Pinecone
    await index.namespace('ns1').upsert(vectors);

    return NextResponse.json({ message: 'Repository contents processed and embeddings stored!' });
  } catch (error) {
    console.error('Error processing repository:', error);
    return NextResponse.json({ error: 'Failed to process repository. Please check the provided parameters and try again.' }, { status: 500 });
  }
}

export const searchSimilarVectors = async () => {
  try {
    // Define your query vector and filter
    const queryVector = [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3]; // Replace with actual vector
    const query = await pc.inference.embed(
      model,
      ['Tell me about this code'],  // Replace with actual query text
      { inputType: 'query' }
    );

    if (query && query[0]?.values) {
      const queryResponse = await index.namespace('ns1').query({
   vector: query[0].values,
    topK: 1,
    includeMetadata: true,
    filter: {
        "genre": {"$eq": "documentary"}
    }
});

      console.log('Query Response:', queryResponse);

      return queryResponse;
    } else {
      console.error('Embedding generation failed or returned undefined values.');
      return null;
    }
  } catch (error) {
    console.error('Error querying similar vectors:', error);
  }
};

// Example usage for the query function
(async () => {
  const result = await searchSimilarVectors();
  if (result) {
    console.log(result);
  } else {
    console.log('No results returned.');
  }
})();
