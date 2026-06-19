/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: emit a self-contained `out/` (HTML/CSS/JS) that Electron
  // serves directly, so the desktop app no longer ships/run the Next server.
  output: "export",
};

export default nextConfig;
