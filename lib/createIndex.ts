import {pc} from './pineconeClient'
(async () => {
  const indexName = 'talktocode';

  await pc.createIndex({
    name: indexName,
    dimension: 3072,
    metric: 'cosine',
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-east-1'
      }
    }
  });
})();