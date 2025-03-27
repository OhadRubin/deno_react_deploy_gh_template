/// <reference lib="deno.ns" />
// Deno version of the auto-deploy script

// Parse command-line arguments
const isFirstTime = Deno.args.includes('--first-time');
const repoNameArg = Deno.args.find(arg => arg.startsWith('--repo-name='));
const providedRepoName = repoNameArg ? repoNameArg.split('=')[1] : null;

// Main function to run the setup and deployment
async function autoSetupAndDeploy() {
  try {
    if (isFirstTime) {
      console.log('\n🚀 First-time setup for GitHub Pages deployment...\n');
    } else {
      console.log('\n🚀 Deploying updates to GitHub Pages...\n');
    }

    // Check requirements
    try {
      const ghVersion = new Deno.Command("gh", { args: ["--version"] });
      const { code } = await ghVersion.output();
      
      if (code === 0) {
        console.log('✓ GitHub CLI is installed');
      } else {
        throw new Error("GitHub CLI command failed");
      }
    } catch (error) {
      console.error('❌ GitHub CLI is not installed. Please install it first:');
      console.error('   Visit: https://cli.github.com/');
      Deno.exit(1);
    }

    // Check if user is logged in to GitHub
    try {
      const ghAuth = new Deno.Command("gh", { args: ["auth", "status"] });
      const { code, stdout } = await ghAuth.output();
      
      if (code === 0) {
        const decoder = new TextDecoder();
        const output = decoder.decode(stdout);
        console.log('✓ Logged in to GitHub');

        // Extract username from auth status output
        const usernameMatch = output.match(/Logged in to github\.com as (\w+)/);
        const username = usernameMatch ? usernameMatch[1] : 'github-user';

        if (isFirstTime) {
          // First-time setup
          let repoName;

          if (providedRepoName) {
            repoName = providedRepoName;
          } else {
            // Prompt for repository name if not provided
            const buf = new Uint8Array(1024);
            console.log('Enter a name for your GitHub repository: ');
            const n = await Deno.stdin.read(buf);
            const input = new TextDecoder().decode(buf.subarray(0, n!)).trim();
            repoName = input || `deno-react-app-${Date.now()}`;
          }

          // Update deno.json with the new values
          console.log('📝 Updating configuration...');
          
          // Repository configuration setup
          const homepageUrl = `https://${username}.github.io/${repoName}`;
          console.log(`✓ Set homepage to: ${homepageUrl}`);

          // Force initialize a fresh git repository
          console.log('📁 Setting up git repository...');
          try {
            // Remove any existing git directory
            try {
              await Deno.remove('.git', { recursive: true });
            } catch (e) {
              // It's okay if .git doesn't exist
            }

            // Initialize a new git repository
            const initGit = new Deno.Command("git", { args: ["init"] });
            await initGit.output();

            const addFiles = new Deno.Command("git", { args: ["add", "."] });
            await addFiles.output();

            const commit = new Deno.Command("git", { args: ["commit", "-m", "Initial commit"] });
            await commit.output();
            
            console.log('✓ Git repository initialized');

            // Create GitHub repository and push
            console.log(`\n🔧 Creating GitHub repository: ${repoName}...`);
            const createRepo = new Deno.Command("gh", { 
              args: ["repo", "create", repoName, "--public", "--source=.", "--push"] 
            });
            await createRepo.output();
            
            console.log('✓ GitHub repository created and code pushed');
          } catch (error) {
            console.error('❌ Error setting up repository:', error.message);
            Deno.exit(1);
          }
        } else {
          // For regular deployments, no repo creation needed
          console.log('Using existing repository configuration');
        }

        // Build the React app using Vite
        console.log('\n🔨 Building React application...');
        try {
          const buildCmd = new Deno.Command("deno", { 
            args: ["task", "build"],
            stdout: "inherit",
            stderr: "inherit"
          });
          const buildResult = await buildCmd.output();
          
          if (buildResult.code === 0) {
            console.log('✓ Application built successfully');
          } else {
            throw new Error("Build failed");
          }
        } catch (error) {
          console.error('❌ Build failed:', error.message);
          Deno.exit(1);
        }

        // Deploy to GitHub Pages
        console.log('\n🚀 Deploying to GitHub Pages...');
        try {
          // Create or checkout gh-pages branch
          const createBranch = new Deno.Command("git", { 
            args: ["checkout", "--orphan", "gh-pages"],
            stderr: "null"
          });
          await createBranch.output();
          
          // Clean out existing contents
          const cleanGit = new Deno.Command("git", { args: ["rm", "-rf", "."] });
          try {
            await cleanGit.output();
          } catch (e) {
            // It's okay if there's nothing to remove
          }
          
          // Copy the built files to the root
          await Deno.copyFile("dist/index.html", "index.html");
          
          // Create assets directory if it doesn't exist
          try {
            await Deno.mkdir("assets", { recursive: true });
          } catch (e) {
            // Directory might already exist
          }
          
          // Copy all assets
          const assets = await Array.fromAsync(Deno.readDir("dist/assets"));
          for (const asset of assets) {
            if (asset.isFile) {
              await Deno.copyFile(`dist/assets/${asset.name}`, `assets/${asset.name}`);
            }
          }
          
          // Stage the new files
          const addBuiltFiles = new Deno.Command("git", { args: ["add", "."] });
          await addBuiltFiles.output();
          
          // Commit the new files
          const commitFiles = new Deno.Command("git", { 
            args: ["commit", "-m", "Deploy to GitHub Pages"] 
          });
          await commitFiles.output();
          
          // Force push to gh-pages branch
          const pushToPages = new Deno.Command("git", { 
            args: ["push", "origin", "gh-pages", "--force"] 
          });
          await pushToPages.output();
          
          // Switch back to main branch
          const backToMain = new Deno.Command("git", { args: ["checkout", "main"] });
          await backToMain.output();
          
          console.log('✓ Deployed to GitHub Pages successfully');
        } catch (error) {
          console.error('❌ Deployment failed:', error.message);
          console.log('You can try deploying manually by pushing to the gh-pages branch');
          Deno.exit(1);
        }

        // Get the repository info to show the URL
        const gitRemote = new Deno.Command("git", { 
          args: ["remote", "get-url", "origin"] 
        });
        const { stdout: remoteStdout } = await gitRemote.output();
        const remoteUrl = new TextDecoder().decode(remoteStdout).trim();
        
        // Extract repo owner and name from remote URL
        // This handles both HTTPS and SSH URLs
        const repoPattern = /github\.com[:/]([^/]+)\/([^/.]+)/;
        const repoMatch = remoteUrl.match(repoPattern);
        
        if (repoMatch) {
          const [, repoOwner, repoName] = repoMatch;
          const deployedUrl = `https://${repoOwner}.github.io/${repoName}/`;
          console.log(`\n🎉 Your app is now live at: ${deployedUrl}`);
        } else {
          console.log(`\n🎉 Your app is now deployed to GitHub Pages!`);
        }
        
        console.log('Note: It may take a few minutes for the site to be fully deployed.');

      } else {
        throw new Error("GitHub auth check failed");
      }
    } catch (error) {
      console.error('❌ Not logged in to GitHub. Please login with:');
      console.error('   Run: gh auth login');
      Deno.exit(1);
    }

  } catch (error) {
    console.error('❌ An error occurred:', error.message);
    Deno.exit(1);
  }
}

// Run the setup function
autoSetupAndDeploy();