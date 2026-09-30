import C from './util/common.js'
import { configure } from './util/cmake.mjs'

// sdl2-compat is configured in make.mjs, because it needs the installed SDL3
await configure(C.dir.sdl3, C.dir.build3)
