import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

async function build() {
  try {
    console.log('Starting build process...');

    // Clean dist directory
    console.log('Cleaning dist directory...');
    await fs.rm('dist', { recursive: true, force: true });
    await fs.mkdir('dist');
    await fs.mkdir('dist/client', { recursive: true });
    await fs.mkdir('dist/server', { recursive: true });

    // Build client
    console.log('Building client...');
    await execAsync('npx vite build', {
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // Build server with ESM support
    console.log('Building server...');
    await execAsync('npx tsc --project tsconfig.json');

    // Copy necessary files
    console.log('Copying static files...');
    try {
      // Copy client build to dist/server/public for production serving
      await fs.cp('dist/client', 'dist/server/public', { recursive: true });

      // Copy db folder for database schema
      await fs.cp('db', 'dist/db', { recursive: true }).catch(() => {
        console.log('No db folder to copy, skipping...');
      });

      // Create a production .env file if it doesn't exist
      const envPath = path.join(__dirname, '.env');
      const prodEnvPath = path.join(__dirname, 'dist', '.env');
      try {
        await fs.access(envPath);
        await fs.copyFile(envPath, prodEnvPath);
      } catch (error) {
        console.warn('No .env file found, skipping env file copy');
      }
    } catch (error) {
      console.error('Error copying files:', error);
      throw error;
    }

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();