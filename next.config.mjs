/** @type {import('next').NextConfig} */
const nextConfig = {
  // unpdf ships its own bundled pdf.js; keep it external so Next doesn't try to bundle worker files
  serverExternalPackages: ['unpdf'],
};

export default nextConfig;
