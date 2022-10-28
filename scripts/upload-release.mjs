import {
	owner, repo, version,
	sysDistDir, sysPublishDir, posixPublishDir,
	assetName,
} from './common.mjs'

const commonHeaders = {
	Accept: 'application/vnd.github+json',
	Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
}

let response

getRelease: {
	echo("get release", version)

	$.verbose = false
	response = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/releases/tags/v${version}`,
		{ headers: commonHeaders },
	)
	$.verbose = true

	if (response.ok) {
		echo("release exists", version)
		break getRelease
	}

	echo("bad status code", response.status)
	echo("create release", version)

	$.verbose = false
	response = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/releases`,
		{
			headers: commonHeaders,
			method: 'POST',
			body: JSON.stringify({
				tag_name: `v${version}`, // eslint-disable-line camelcase
				name: `v${version}`,
			}),
		},
	)
	$.verbose = true
	if (!response.ok) { throw new Error(`bad status code ${response.status}`) }
}
const releaseId = (await response.json()).id

echo("create archive", assetName)
await $`rm -rf ${posixPublishDir}`
await $`mkdir -p ${posixPublishDir}`
const sysAssetPath = path.join(sysPublishDir, assetName)
const posixAssetPath = path.posix.join(posixPublishDir, assetName)

cd(sysDistDir)
await $`tar czf ${posixAssetPath} *`
const buffer = await fs.readFile(sysAssetPath)

$.verbose = false
response = await fetch(
	`https://api.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets`,
	{ headers: commonHeaders },
)
$.verbose = true
if (!response.ok) { throw new Error(`bad status code ${response.status}`) }

const list = await response.json()
const asset = list.find((x) => x.name === assetName)
if (asset) {
	echo("delete asset", assetName)
	$.verbose = false
	response = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/releases/assets/${asset.id}`,
		{
			headers: commonHeaders,
			method: 'DELETE',
		},
	)
	$.verbose = true
	if (!response.ok) { throw new Error(`bad status code ${response.status}`) }
}

echo("upload", assetName)
$.verbose = false
response = await fetch(
	`https://uploads.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${assetName}`,
	{
		headers: {
			...commonHeaders,
			'Content-Type': 'application/gzip',
			'Content-Length': buffer.length,
		},
		method: 'POST',
		body: buffer,
	},
)
$.verbose = true
if (!response.ok) { throw new Error(`bad status code ${response.status}`) }
