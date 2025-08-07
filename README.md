# Nexus AI - Corporate Intelligence Platform

AI-powered beneficial ownership verification and corporate structure analysis platform for UK financial institutions.

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS, Chakra UI
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage, Real-time)
- **AI**: DeepSeek API for intelligent processing
- **Deployment**: Vercel for frontend, Supabase for backend
- **Authentication**: Google OAuth via Supabase Auth

## Features

- 🤖 AI-powered entity resolution and data reconciliation
- 📊 Interactive corporate hierarchy visualizations
- 🔍 Companies House and OpenCorporates API integration
- 📈 Real-time data processing and insights
- 🛡️ GDPR compliant with comprehensive audit trails
- 📱 Mobile-responsive design

## Getting Started

### Prerequisites

- Node.js 18.17.0+
- npm or yarn
- Supabase account
- DeepSeek API key
- Companies House API key (optional)
- OpenCorporates API key (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd nexus-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your API keys and configuration values.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage

## Project Structure

```
nexus-ai/
├── app/                    # Next.js App Router
├── components/             # React components
├── lib/                    # Utility libraries
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
├── stores/                 # State management
└── supabase/              # Supabase migrations and functions
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.