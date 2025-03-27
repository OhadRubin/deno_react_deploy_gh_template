# Deno React GitHub Pages Template

A template for creating and deploying React applications to GitHub Pages with Tailwind CSS using Deno, Vite, and one-click deployment.

## Features

- 🦕 Deno for runtime and TypeScript support
- ⚛️ React with TypeScript
- ⚡ Vite for fast development and optimized builds
- 🎨 Tailwind CSS for styling
- 📱 Responsive design
- 🚀 GitHub Pages deployment
- 🤖 One-click automated deployment

## Prerequisites

- [Deno](https://deno.land/#installation) installed (v1.37.0 or later)
- [GitHub CLI](https://cli.github.com/) installed

## Quick Start

1. First-time setup:
   ```
   deno task init-and-deploy
   ```
   You'll be prompted to enter a repository name, or you can provide one directly:
   ```
   deno task init-and-deploy --repo-name="my-awesome-app"
   ```

2. For subsequent updates, simply run:
   ```
   deno task deploy
   ```

Your app will be available at the URL provided in the console output.

## Development

- Start the development server:
  ```
  deno task start
  ```
- Build for production:
  ```
  deno task build
  ```
- Preview the production build:
  ```
  deno task preview
  ```

## Customization

- Modify the components in the `src` directory
- Customize Tailwind CSS in `tailwind.config.js`
- Update the page title and metadata in `index.html`

## Project Structure

```
.
├── deno.json             # Deno configuration file
├── index.html            # HTML entry point
├── postcss.config.js     # PostCSS configuration
├── scripts/              # Deployment and utility scripts
├── src/                  # Application source code
│   ├── App.css           # Main application styles
│   ├── App.tsx           # Main application component
│   └── index.tsx         # Entry point for the React app
├── tailwind.config.js    # Tailwind CSS configuration
└── vite.config.ts        # Vite configuration
```

## Troubleshooting

If the initialization fails:

- Make sure Deno is installed: `deno --version`
- Make sure GitHub CLI is installed: `gh --version`
- Make sure you're logged in to GitHub: `gh auth status`
- Check error messages in the console output

## License

MIT