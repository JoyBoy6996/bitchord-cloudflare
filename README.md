# BitChord Cloudflare

Cloudflare-native backend for BitChord.

## Architecture

BitChord
   |
   v
Cloudflare Worker
   |
   +---- D1
   |      |
   |      +---- Track metadata
   |      +---- Search index
   |      +---- Telegram cursor
   |
   +---- KV
          |
          +---- Hot cache

Telegram
   |
   v
Incremental indexer
   |
   v
D1


## Features

- Persistent track catalog
- D1-backed search
- Incremental Telegram indexing
- Track metadata API
- Atmos metadata support
- Cloudflare Worker API
- KV cache support
- Designed for 50k+ tracks


## Development

Install dependencies:

npm install


Run locally:

npm run dev


Deploy:

npm run deploy