# Firebase Studio

This is a NextJS starter in Firebase Studio.

## Getting Started

Follow these steps to get the development environment running on your local machine using Visual Studio Code.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or v20.x is recommended for compatibility with Genkit and Next.js 14)
- [npm](https://www.npmjs.com/) (which is included with Node.js)

### 1. Install Dependencies

Open the integrated terminal in VS Code (`Ctrl+` or `Cmd+`) and run the following command. This will install all the necessary packages for the project to run.

```bash
npm install
```

### 2. Check Environment Variables

Ensure you have a `.env` file in the root of your project. This file is critical for storing your API keys and Firebase project configuration. It should contain your `GEMINI_API_KEY` and your Firebase project details.

```
# Genkit
GENKIT_ENV=dev
GEMINI_API_KEY=YOUR_API_KEY_HERE

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... other Firebase keys
```

### 3. Run the Development Server

To start the application, use the `dev` script defined in `package.json`. This single command will concurrently start the Next.js frontend server and the Genkit AI service.

```bash
npm run dev
```

### 4. Access the Application

Once the command is running successfully, you can access the different parts of your application in your web browser:

- **Web Application**: [http://localhost:9002](http://localhost:9002)
- **Genkit Developer UI**: [http://localhost:10001](http://localhost:10001) (This is a tool for inspecting and debugging your AI flows)
