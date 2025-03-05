# GameVault

GameVault is a Next.js application for discovering, tracking, and discussing video games with a clean, modern interface.

## Features

- Browse trending and popular games
- Game details with screenshots, videos, and descriptions
- User authentication and profiles
- Search functionality
- Responsive design for all devices

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Firebase account (for authentication and database)
- RAWG API key (for game data)

## Environment Setup

This project uses environment variables for API keys and configuration. You need to create a `.env.local` file in the root directory with the following variables:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

# RAWG API Configuration
NEXT_PUBLIC_RAWG_API_KEY=your_rawg_api_key
RAWG_API_KEY=your_rawg_api_key

# Other Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### How to get these keys:

1. **Firebase Configuration**:
   - Create a project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password, Google, etc.)
   - Create a Firestore Database
   - Enable Storage
   - Go to Project Settings > Your Apps > Web App to get your config values

2. **RAWG API Key**:
   - Register at [RAWG](https://rawg.io/apidocs)
   - Get your API key from the dashboard

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/schneidercadet/gamevault.git
   cd gamevault
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create `.env.local` file with the variables listed above

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application

## Build for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

Then start the production server:

```bash
npm run start
# or
yarn start
```

## Firebase Setup for Authentication and Database

Ensure your Firebase project has:

1. Authentication with Email/Password enabled
2. Firestore Database with proper security rules
3. Storage configured for profile images and other assets

## Deployment

The application can be deployed to Vercel or any other hosting platform that supports Next.js applications.

To deploy on Vercel:
1. Push your code to GitHub
2. Connect to Vercel and import the repository
3. Set up your environment variables in the Vercel dashboard
4. Deploy
