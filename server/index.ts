import { createApp } from './app.js'
import { getCACertificates, setDefaultCACertificates } from 'node:tls'

try { process.loadEnvFile?.() } catch (error) {
  if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error
}

// Include OS-managed trust roots without disabling TLS verification. This is
// important on managed Windows machines whose HTTPS inspection CA is not in
// Node's bundled certificate set.
setDefaultCACertificates([...getCACertificates('default'), ...getCACertificates('system')])

const port = Number(process.env.PORT ?? 3001)
const app = createApp()
app.listen(port, '127.0.0.1', () => {
  console.log(`GuideWise API running at http://127.0.0.1:${port}`)
})
