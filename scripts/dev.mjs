import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const children = ['server/worker', 'client'].map((directory) =>
  spawn('npm', ['--prefix', directory, 'run', 'dev'], {
    cwd: root,
    stdio: 'inherit',
    detached: process.platform !== 'win32',
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
  }),
)
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) {
    try {
      process.platform === 'win32' ? child.kill('SIGTERM') : process.kill(-child.pid, 'SIGTERM')
    } catch {
      /* Already exited. */
    }
  }
  process.exitCode = code
}
for (const child of children) {
  child.on('error', (error) => {
    console.error(error.message)
    stop(1)
  })
  child.on('exit', (code) => stop(code ?? 0))
}
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
