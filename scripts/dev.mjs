import { spawn } from 'node:child_process'

const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run this script through npm run dev:all.')
const children = ['dev:frontend', 'dev:server'].map((script) => spawn(process.execPath, [npmCli, 'run', script], { stdio: 'inherit' }))
const stop = () => children.forEach((child) => child.kill())
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
await Promise.race(children.map((child) => new Promise((resolve) => child.on('exit', resolve))))
stop()
