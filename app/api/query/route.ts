import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Initialize Pinecone and embeddings
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});
const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
const embeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "embedding-001",
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY,
});

// Function to handle querying Pinecone
export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    console.log(`Generating embedding for the question: ${question}`);
    const questionEmbedding = await embeddings.embedQuery(question);

    if (!questionEmbedding || questionEmbedding.length === 0) {
      throw new Error('Failed to generate embedding for the question.');
    }

    console.log('Querying Pinecone...');
    const queryResults = await index.query({
      topK: 5, // Get the top 5 closest matches
      vector: questionEmbedding,
      includeMetadata: true,
    });

    if (!queryResults.matches || queryResults.matches.length === 0) {
      return NextResponse.json({ error: 'No matches found.' });
    }

    console.log('Query results found:', queryResults.matches);

    // Safely handle optional metadata
    const results = queryResults.matches.map((match) => {
      // Ensure metadata exists before accessing its properties
      const metadataText = match.metadata?.text ?? 'No text available';
      const score = match.score ?? 0;

      return {
        text: metadataText,
        score: score,
      };
    });

    return NextResponse.json({
      message: 'Query successful!',
      results,
    });
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    return NextResponse.json(
      { error: 'Failed to query embeddings. Please try again.' },
      { status: 500 }
    );
  }
}
