const Fs = require("fs");
const Path = require("path");

const dir = {};
dir.root = Path.resolve(__dirname, "../..");
dir.sdl = Path.join(dir.root, "sdl");
dir.build = Path.join(dir.root, "build");
dir.sdl3 = Path.join(dir.root, "sdl3");
dir.build3 = Path.join(dir.root, "build3");
dir.dist = Path.join(dir.root, "dist");
dir.publish = Path.join(dir.root, "publish");

const pkgPath = Path.join(dir.root, "package.json");
const pkg = JSON.parse(Fs.readFileSync(pkgPath).toString());
const version = pkg.version.slice(0, pkg.version.indexOf("-"));
const [, owner, repo] = pkg.repository.url.match(/([^/:]+)\/([^/]+).git$/u);

// SDL3 version that sdl2-compat is built against and bundled with
const sdl3Version = process.env.BUILD_SDL3_VERSION || "3.4.0";

const { platform, arch } = process;
const targetArch = process.env.CROSS_COMPILE_ARCH || arch;
const assetName = `SDL-v${version}-${platform}-${targetArch}.tar.gz`;

module.exports = {
  dir,
  version,
  sdl3Version,
  isPrerelease: false, // TODO
  owner,
  repo,
  platform,
  arch,
  targetArch,
  assetName,
};
