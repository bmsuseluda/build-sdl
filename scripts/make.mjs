import Fs from "node:fs";
import Path from "node:path";
import { execSync } from "node:child_process";
import C from "./util/common.js";
import { configure, buildAndInstall } from "./util/cmake.mjs";

await Fs.promises.rm(C.dir.dist, { recursive: true }).catch(() => {});
await Fs.promises.mkdir(C.dir.dist, { recursive: true });

// sdl2-compat needs SDL3 installed to configure and to link against
buildAndInstall(C.dir.build3);

// Lets libSDL2 find the bundled libSDL3 next to it
const installRpathFlag = {
  linux: "-DCMAKE_INSTALL_RPATH='$ORIGIN'",
  darwin: '-DCMAKE_INSTALL_RPATH="@loader_path"',
}[C.platform];

await configure(C.dir.sdl, C.dir.build, [
  `-DCMAKE_PREFIX_PATH="${C.dir.dist}"`,
  installRpathFlag,
]);
buildAndInstall(C.dir.build);

// Delete files we won't need
{
  const platformFilter = {
    linux: (name) => name.includes(".so"),
    darwin: (name) => name.endsWith(".dylib"),
    win32: (name) =>
      ["SDL2.dll", "SDL2.lib", "SDL3.dll", "SDL3.lib"].includes(name),
  }[C.platform];

  const recurse = async (dirPath) => {
    const files = await Fs.promises.readdir(dirPath);

    await Promise.all(
      files.map(async (name) => {
        const childPath = Path.join(dirPath, name);
        const stats = await Fs.promises.stat(childPath);
        if (stats.isDirectory()) {
          await recurse(childPath);
          return;
        }

        if (name.endsWith(".h") || platformFilter(name)) {
          return;
        }

        await Fs.promises.rm(childPath);
      }),
    );
  };
  await recurse(C.dir.dist);
}

// Move the .dll to the /lib folder
const move = async (src, dst) => {
  await Fs.promises.cp(src, dst, { verbatimSymlinks: true });
  await Fs.promises.rm(src);
};

if (C.platform === "win32") {
  await Promise.all(
    ["SDL2.dll", "SDL3.dll"].map((name) =>
      move(
        Path.join(C.dir.dist, "bin", name),
        Path.join(C.dir.dist, "lib", name),
      ),
    ),
  );
}

// Move the headers to the root of /include
{
  const shallowDir = Path.join(C.dir.dist, "include");
  const deepDir = Path.join(shallowDir, "SDL2");
  const headers = await Fs.promises.readdir(deepDir);
  await Promise.all(
    headers.map(async (name) => {
      await move(Path.join(deepDir, name), Path.join(shallowDir, name));
    }),
  );
}

// Delete all empty dirs
{
  const recurse = async (dirPath) => {
    const files1 = await Fs.promises.readdir(dirPath);
    await Promise.all(
      files1.map(async (name) => {
        const childPath = Path.join(dirPath, name);
        const stats = await Fs.promises.stat(childPath);
        if (stats.isDirectory()) {
          await recurse(childPath);
        }
      }),
    );

    const files2 = await Fs.promises.readdir(dirPath);
    if (files2.length === 0) {
      await Fs.promises.rm(dirPath, { recursive: true });
    }
  };
  await recurse(C.dir.dist);
}

// Strip binaries on linux
if (C.platform === "linux") {
  const libDir = Path.join(C.dir.dist, "lib");
  const libraries = await Fs.promises.readdir(libDir);
  for (const name of libraries) {
    const libPath = Path.join(libDir, name);
    const stats = await Fs.promises.lstat(libPath);
    if (stats.isSymbolicLink()) {
      continue;
    }
    execSync(`strip -s "${libPath}"`);
  }
}
