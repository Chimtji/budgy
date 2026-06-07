'use strict';

/**
 * electron-builder afterPack hook.
 *
 * Turbopack emits `.next/node_modules/<hashed-name>` as a symlink pointing to
 * the real package in the project root `node_modules/`. electron-builder does
 * NOT follow or copy these symlinks, so the packaged app can't resolve external
 * modules (e.g. better-sqlite3) at runtime.
 *
 * This hook recreates those symlinks inside the packaged app so that Node.js
 * module resolution finds the correctly rebuilt native binaries that electron-
 * builder has already placed in `node_modules/`.
 */

const fs = require('fs');
const path = require('path');

module.exports = async function afterPack(context) {
  const { appOutDir, packager } = context;
  const productFilename = packager.appInfo.productFilename;

  // Path to the bundled app's resource directory
  const appDir = path.join(appOutDir, `${productFilename}.app`, 'Contents', 'Resources', 'app');

  const destNextNodeModules = path.join(appDir, '.next', 'node_modules');
  const srcNextNodeModules = path.join(process.cwd(), '.next', 'node_modules');

  if (!fs.existsSync(srcNextNodeModules)) return;

  // If the dest directory is already present (e.g. electron-builder copied it
  // somehow), skip to avoid double-processing.
  if (fs.existsSync(destNextNodeModules)) return;

  fs.mkdirSync(destNextNodeModules, { recursive: true });

  const entries = fs.readdirSync(srcNextNodeModules);
  for (const entry of entries) {
    const srcEntry = path.join(srcNextNodeModules, entry);
    const stat = fs.lstatSync(srcEntry);

    if (stat.isSymbolicLink()) {
      // Preserve the original relative symlink target so it resolves correctly
      // inside the packaged app (same directory structure as source).
      const linkTarget = fs.readlinkSync(srcEntry);
      fs.symlinkSync(linkTarget, path.join(destNextNodeModules, entry));
      console.log(`afterPack: created symlink .next/node_modules/${entry} -> ${linkTarget}`);
    } else if (stat.isDirectory()) {
      // Copy real directories as-is (no symlinks needed).
      fs.cpSync(srcEntry, path.join(destNextNodeModules, entry), { recursive: true });
      console.log(`afterPack: copied directory .next/node_modules/${entry}`);
    }
  }
};
