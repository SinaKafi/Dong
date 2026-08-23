import type { NextConfig } from "next";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const explicitBasePath = process.env.BASE_PATH;
const inferredBasePath = repoName && !repoName.endsWith(".github.io") ? `/${repoName}` : "";
const basePath = explicitBasePath ?? inferredBasePath;

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
};

export default nextConfig;
