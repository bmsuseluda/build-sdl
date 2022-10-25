import { owner, repo, version, sdlOutDir, assetName } from './common.mjs'

const url = `https://github.com/${owner}/${repo}/releases/download/v${version}/${assetName}`

echo("fetch", url)
$.verbose = false
const response = await fetch(url)
if (!response.ok) { throw new Error(`bad status code ${response.status}`) }
$.verbose = true

echo("unpack to", sdlOutDir)
await $`mkdir -p ${sdlOutDir}`
const tar = $`tar xz -C ${sdlOutDir} --strip=1`
response.body.pipe(tar.stdin)
await tar
