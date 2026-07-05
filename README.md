# Spotify AI Review Discovery Engine

This is the public-test workflow link for the NextLeap Spotify project.

## What the evaluator can test

Open `/workflow.html?demo`, then:

1. Load or paste reviews.
2. Click **Run workflow analysis**.
3. Review theme clusters, user segments, JTBD, evidence snippets, RICE-style opportunity scoring, and the recommended MVP.
4. Export JSON or CSV.

## Deploy quickly

### Option A — Fast public demo without GPT backend

Upload this folder to any static host. The workflow still works using the built-in local analyzer.

Final URL to submit:

```txt
https://YOUR-SITE/workflow.html?demo
```

### Option B — GPT-powered Vercel deployment

1. Put this folder in a GitHub repository.
2. Import the repository into Vercel.
3. Add environment variable:

```txt
OPENAI_API_KEY=your_api_key_here
```

Optional:

```txt
OPENAI_MODEL=gpt-4.1-mini
```

4. Deploy.
5. Submit:

```txt
https://YOUR-VERCEL-SITE.vercel.app/workflow.html?demo
```

## Safety note

Do not put API keys directly into `workflow.html`. Use environment variables in Vercel/Netlify/your backend.
