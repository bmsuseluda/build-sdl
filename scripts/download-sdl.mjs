import Fs from 'node:fs'
import { once } from 'node:events'
import C from './util/common.js'
import { fetch } from './util/fetch.js'
import * as Tar from 'tar'

const download = async (url, dir) => {
	console.log("fetch", url)
	const response = await fetch(url)

	console.log("unpack to", dir)
	await Fs.promises.rm(dir, { recursive: true }).catch(() => {})
	await Fs.promises.mkdir(dir, { recursive: true })
	const tar = Tar.extract({ gzip: true, strip: 1, C: dir })
	response.stream().pipe(tar)
	await once(tar, 'finish')
}

await download(
	`https://github.com/libsdl-org/sdl2-compat/releases/download/release-${C.version}/sdl2-compat-${C.version}.tar.gz`,
	C.dir.sdl,
)
await download(
	`https://github.com/libsdl-org/SDL/releases/download/release-${C.sdl3Version}/SDL3-${C.sdl3Version}.tar.gz`,
	C.dir.sdl3,
)
