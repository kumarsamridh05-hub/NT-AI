# NTA AI

NTA AI is a premium, immersive AI chat companion built with React, Express, and the Gemini API. It features persistent chat history using SQLite and a high-performance, atmospheric UI.

## Features

- **Immersive UI**: Atmospheric background with glassmorphism and smooth animations.
- **Persistent History**: All your chats are saved locally in a SQLite database.
- **Gemini 3 Flash**: Powered by the latest Gemini models for fast and accurate responses.
- **GitHub Optimized**: Easy-to-copy markdown responses for seamless sharing.
- **No Auto-Scroll by Default**: Full control over your reading experience.

## Getting Started

### Prerequisites

- Node.js (v18+)
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/zenith-ai.git
   cd zenith-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Tech Stack

- **Frontend**: React, Tailwind CSS, Motion, Lucide React
- **Backend**: Express, Better-SQLite3
- **AI**: @google/genai (Gemini API)
- **Build Tool**: Vite

## License

Apache-2.0
