import { spawn } from 'node:child_process';

const windows = process.platform === 'win32';
const processes = [
  spawn('php', ['backend/artisan', 'serve', '--host=127.0.0.1', '--port=8000'], { stdio: 'inherit', shell: windows }),
  spawn(windows ? 'npm.cmd' : 'npm', ['run', 'dev:frontend'], { stdio: 'inherit', shell: windows }),
];

const stop = () => processes.forEach((child) => child.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
processes.forEach((child) => child.on('exit', (code) => {
  if (code && code !== 0) process.exitCode = code;
}));
