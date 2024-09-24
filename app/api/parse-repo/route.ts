import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "embedding-001",
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

// Function to chunk text
function chunkText(text: string, maxChunkSize: number = 8000): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  text.split('\n').forEach(line => {
    if (currentChunk.length + line.length > maxChunkSize) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += line + '\n';
  });

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Handle repository processing and embedding upsert
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, repo } = body;

    if (!username || !repo) {
      return NextResponse.json(
        { error: 'Username and repository name are required' },
        { status: 400 }
      );
    }

    console.log(`Processing repository: ${username}/${repo}`);

    // Initialize Octokit for GitHub API calls
    const octokit = new Octokit({
      auth: process.env.NEXT_PUBLIC_GITHUB_TOKEN,
    });

    // Fetch repository content
    const repoContents = await octokit.repos.getContent({
      owner: username,
      repo,
      path: '',
    });

    const files = Array.isArray(repoContents.data) ? repoContents.data : [repoContents.data];
    const fileData: Array<{ id: string; text: string; chunks: string[] }> = [];

    console.log(`Found ${files.length} files in the repository`);

    for (const file of files) {
      if (file.type === 'file') {
        const fileContent = await octokit.repos.getContent({
          owner: username,
          repo,
          path: file.path,
          mediaType: { format: 'raw' },
        });

        if (typeof fileContent.data === 'string') {
          const chunks = chunkText(fileContent.data); // Ensure chunkText works correctly
          fileData.push({
            id: file.sha,
            text: fileContent.data,
            chunks: chunks,
          });
          console.log(`Processed file: ${file.path}. Chunks: ${chunks.length}`);
        }
      }
    }

    const allChunks = fileData.flatMap((file) => file.chunks);
    console.log(`Total chunks to be embedded: ${allChunks.length}`);

    // Add log to verify the contents of the first chunk
    console.log(`First chunk of data: ${allChunks[0]}`);

    console.log('Starting embedding generation...');

    const embeddingResults = await Promise.all(
      allChunks.map(async (chunk, index) => {
        if (!chunk || chunk.trim().length === 0) {
          console.warn(`Chunk ${index} is empty or invalid, skipping embedding.`);
          return null;
        }
        try {
          return await embeddings.embedQuery(chunk); // No second argument
        } catch (embeddingError) {
          console.error(`Failed to generate embedding for chunk ${index}:`, embeddingError);
          return null; // Handle embedding failure
        }
      })
    );

    // Filter out any null/empty embeddings
    const validEmbeddings = embeddingResults.filter((embedding) => embedding && embedding.length > 0);

    if (!validEmbeddings || validEmbeddings.length === 0) {
      throw new Error('Failed to generate any valid embeddings');
    }

    console.log(`Valid embeddings generated: ${validEmbeddings.length}`);

    const vectors = fileData.flatMap((file, fileIndex) =>
      file.chunks.map((chunk, chunkIndex) => {
        const embedding = embeddingResults[fileIndex * file.chunks.length + chunkIndex];

        if (!embedding || embedding.length === 0) {
          console.warn(`Embedding is empty for chunk ${chunkIndex}, skipping this vector.`);
          return null;
        }

        return {
          id: `${file.id}-chunk-${chunkIndex}`,
          values: embedding,
          metadata: {
            text: chunk,
            path: file.id,
            chunkIndex: chunkIndex,
            totalChunks: file.chunks.length,
          },
        };
      })
    );

    // Filter out null vectors (i.e., chunks without embeddings)
    const validVectors = vectors.filter((vector) => vector !== null);

    if (validVectors.length === 0) {
      throw new Error('No valid vectors to upsert into Pinecone.');
    }

    console.log(`Valid vectors prepared for Pinecone: ${validVectors.length}`);

    console.log('Starting upsert to Pinecone...');
    await index.upsert(validVectors);
    console.log('Upsert to Pinecone completed');

    return NextResponse.json({
      message: 'Repository contents processed and embeddings stored!',
    });
  } catch (error) {
    console.error('Error processing repository:', error);
    return NextResponse.json(
      { error: 'Failed to process repository. Please check the provided parameters and try again.' },
      { status: 500 }
    );
  }
}
