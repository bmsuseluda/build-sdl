import Fs from "node:fs";
import { execSync } from "node:child_process";
import C from "./common.js";

let CFLAGS;
let LDFLAGS;
let crossCompileFlag;
if (C.platform === "darwin") {
  let arch = process.env.CROSS_COMPILE_ARCH ?? C.arch;
  if (arch === "x64") {
    arch = "x86_64";
  }

  crossCompileFlag = `-DCMAKE_OSX_ARCHITECTURES="${arch}"`;

  if (C.targetArch === "arm64") {
    CFLAGS = "-mmacosx-version-min=11.0";
    LDFLAGS = "-mmacosx-version-min=11.0";
  } else {
    CFLAGS = [
      "-mmacosx-version-min=10.9",
      "-DMAC_OS_X_VERSION_MIN_REQUIRED=1070",
    ].join(" ");
    LDFLAGS = "-mmacosx-version-min=10.9";
  }
}

export const configure = async (sourceDir, buildDir, extraFlags = []) => {
  console.log("configure build in", buildDir);

  await Fs.promises.rm(buildDir, { recursive: true }).catch(() => {});
  await Fs.promises.mkdir(buildDir, { recursive: true });

  execSync(
    `cmake ${[
      "-S",
      `"${sourceDir}"`,
      "-B",
      `"${buildDir}"`,
      `-DCMAKE_INSTALL_PREFIX:PATH="${C.dir.dist}"`,
      "-DCMAKE_BUILD_TYPE=Release",
      "-DSDL_TESTS=OFF",
      "-DSDL_INSTALL_TESTS=OFF",
      crossCompileFlag,
      ...extraFlags,
    ]
      .filter(Boolean)
      .join(" ")}`,
    {
      stdio: "inherit",
      env: {
        ...process.env,
        CFLAGS,
        LDFLAGS,
      },
    },
  );
};

export const buildAndInstall = (buildDir) => {
  console.log("build in", buildDir);
  const parallelFlag = process.env.BUILD_SDL_PARALLEL ? "--parallel" : "";
  execSync(`cmake --build "${buildDir}" --config Release ${parallelFlag}`, {
    stdio: "inherit",
  });

  console.log("install to", C.dir.dist);
  execSync(`cmake --install "${buildDir}" --config Release`, {
    stdio: "inherit",
  });
};
