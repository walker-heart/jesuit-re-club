import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function build() {
  try {
    // Clean dist directory
    console.log('Cleaning dist directory...');
    await fs.rm('dist', { recursive: true, force: true });
    await fs.mkdir('dist');

    // Build client
    console.log('Building client...');
    await execAsync('vite build');

    // Build server
    console.log('Building server...');
    await execAsync('tsc --project tsconfig.json');

    // Copy necessary files
    console.log('Copying files...');
    await fs.cp('server/public', 'dist/server/public', { recursive: true });

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build(); 