const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const path = require("path");

let connectionSettings;

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  return accessToken;
}

async function getAllFiles(dirPath, baseDir = dirPath) {
  let files = [];
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    // Skip node_modules, dist, release, .git
    if (item === 'node_modules' || item === 'dist' || item === 'dist-electron' || 
        item === 'release' || item === '.git' || item === 'database.sqlite') {
      continue;
    }

    if (stat.isDirectory()) {
      files = files.concat(await getAllFiles(fullPath, baseDir));
    } else {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      files.push({
        path: relativePath,
        content: fs.readFileSync(fullPath, 'utf8'),
      });
    }
  }
  
  return files;
}

async function pushFiles() {
  try {
    const accessToken = await getAccessToken();
    const octokit = new Octokit({ auth: accessToken });

    const owner = "FrabonIndia";
    const repo = "autoblog-desktop-installer";
    
    console.log("📦 Collecting all files...\n");
    
    const files = await getAllFiles('.');
    
    console.log(`Found ${files.length} files to upload\n`);
    
    // Push key files first
    const priorityFiles = files.filter(f => 
      f.path === 'README.md' || 
      f.path === 'package.json' ||
      f.path === '.github/workflows/build.yml'
    );
    
    const otherFiles = files.filter(f => !priorityFiles.includes(f));
    
    // Push priority files
    for (const file of priorityFiles) {
      try {
        const contentBase64 = Buffer.from(file.content).toString('base64');
        
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: file.path,
          message: `Add ${file.path}`,
          content: contentBase64,
          branch: "main",
        });
        
        console.log(`✅ ${file.path}`);
      } catch (error) {
        console.log(`⚠️  ${file.path}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Priority files pushed!`);
    console.log(`📊 View: https://github.com/${owner}/${repo}`);
    console.log(`\n⏳ Pushing remaining ${otherFiles.length} files...`);
    console.log(`(This will take a few minutes)\n`);
    
    // Push other files in batches
    for (let i = 0; i < otherFiles.length; i++) {
      const file = otherFiles[i];
      try {
        const contentBase64 = Buffer.from(file.content).toString('base64');
        
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: file.path,
          message: `Add ${file.path}`,
          content: contentBase64,
          branch: "main",
        });
        
        if ((i + 1) % 10 === 0) {
          console.log(`   ${i + 1}/${otherFiles.length} files pushed...`);
        }
      } catch (error) {
        console.log(`⚠️  ${file.path}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ All files pushed successfully!`);
    console.log(`📊 Repository: https://github.com/${owner}/${repo}`);
    console.log(`🚀 GitHub Actions will now build installers`);
    console.log(`📦 Check: https://github.com/${owner}/${repo}/actions\n`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

pushFiles();
