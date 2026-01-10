# Bloom - AI-native notebook for students

A beautiful note-taking application with AI-powered live transcription, built with Next.js, Tailwind CSS, and shadcn/ui.

## Features

- 🎨 Beautiful, minimalist design with pink and white gradient backgrounds
- 📁 Create and organize notebooks/folders for different classes
- ✍️ Rich text editor with Tiptap (formatting, fonts, images, links)
- 🔐 User authentication with Clerk
- 💾 Persistent storage with Supabase
- 🧭 Collapsible sidebar navigation
- ✨ Auto-save functionality

## Tech Stack

- **Framework**: Next.js 16
- **Runtime**: Bun
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (custom components)
- **Editor**: Tiptap
- **Auth**: Clerk
- **Database**: Supabase
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Bun installed on your system
- A Clerk account (https://clerk.com)
- A Supabase account (https://supabase.com)

### Installation

1. Install dependencies:
```bash
bun install
```

2. Create a `.env.local` file with your credentials:
```env
# Supabase (for database storage)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key  # Found in Supabase > Settings > API

# Clerk (for authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key

# Clerk redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# AI Transcription (optional)
GROQ_API_KEY=your-groq-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
```

3. Set up Supabase database:
   - Create a new Supabase project
   - Run the SQL in `supabase/schema.sql` in the SQL Editor

4. Set up Clerk:
   - Create a new Clerk application
   - Enable Google OAuth (optional)
   - Copy your API keys to `.env.local`

5. Run the development server:
```bash
bun dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
bloom-notes/
├── app/
│   ├── app/              # Main application routes
│   │   ├── space/        # My space page
│   │   ├── folder/[id]/  # Individual folder pages
│   │   ├── note/         # Note pages (new and edit)
│   │   ├── settings/     # Settings page
│   │   └── help/         # Help center
│   ├── sign-in/          # Clerk sign-in page
│   ├── sign-up/          # Clerk sign-up page
│   ├── layout.tsx        # Root layout with ClerkProvider
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # Reusable UI components
│   ├── editor/           # Tiptap editor components
│   ├── sidebar.tsx       # Navigation sidebar
│   └── new-folder-modal.tsx # Create folder modal
├── hooks/
│   ├── use-folders.ts    # Folders CRUD hook
│   └── use-notes.ts      # Notes CRUD hook
├── lib/
│   ├── supabase/         # Supabase client configuration
│   └── utils.ts          # Utility functions
└── supabase/
    └── schema.sql        # Database schema
```

## Pages

- **Landing Page** (`/`): Welcome screen with sign-up button
- **Sign In** (`/sign-in`): Clerk sign-in page
- **Sign Up** (`/sign-up`): Clerk sign-up page
- **Home** (`/app`): Main dashboard with folders and notes
- **My Space** (`/app/space`): View all folders and notes
- **Folder** (`/app/folder/[id]`): Notes in a specific folder
- **New Note** (`/app/note/new`): Create a new note
- **Edit Note** (`/app/note/[id]`): Edit an existing note
- **Settings** (`/app/settings`): Application settings
- **Help Center** (`/app/help`): Help and documentation

## Editor Features

The Tiptap editor includes:
- **Text Formatting**: Bold, Italic, Underline, Strikethrough
- **Headings**: H1, H2, H3
- **Lists**: Bullet and Numbered lists
- **Font Selection**: Multiple font families
- **Text Color**: Color picker
- **Alignment**: Left, Center, Right
- **Links**: Insert and edit links
- **Images**: Upload and embed images
- **Code**: Inline code and code blocks
- **Quotes**: Block quotes
- **Highlight**: Text highlighting

## Development

- `bun dev` - Start development server
- `bun build` - Build for production
- `bun start` - Start production server
- `bun lint` - Run ESLint

## License

MIT
