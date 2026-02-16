const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const archiveDir = path.join(rootDir, 'temp_archive');

if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir);
}

const essentialFiles = [
    '.agent', '.antigravityignore', '.env.example', '.env.local', '.env.production',
    '.eslintrc.cjs', '.git', '.github', '.gitignore', '.kiro', '.logs', '.markdownlint.json',
    '.vscode', 'dist', 'docs', 'node_modules', 'public', 'scripts', 'src', 'styles', 'tests',
    'Dockerfile', 'docker-compose.yml', 'eslint.config.js', 'index.html', 'mcp-config.json',
    'mcp-server.ts', 'nginx.conf', 'package-lock.json', 'package.json', 'postcss.config.js',
    'tailwind.config.js', 'tsconfig.json', 'tsconfig.node.json', 'vite-env.d.ts',
    'vite.config.ts', 'vitest.config.ts', 'README.md', 'CHANGELOG.md', 'LICENSE', 'temp_archive', 'clean_root.js'
];

const files = fs.readdirSync(rootDir);

files.forEach(file => {
    if (!essentialFiles.includes(file)) {
        const fullPath = path.join(rootDir, file);
        const destPath = path.join(archiveDir, file);

        try {
            fs.renameSync(fullPath, destPath);
            console.log(`Moved: ${file}`);
        } catch (e) {
            console.error(`Error moving ${file}: ${e.message}`);
        }
    }
});
