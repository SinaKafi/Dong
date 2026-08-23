## Dong

Persian-first group expense splitter built with Next.js 16, React 19, and Tailwind CSS 4.

## Local development

Install dependencies and start the dev server:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## GitHub Pages deployment

This repository is configured for static export so it can be deployed to GitHub Pages through GitHub Actions.

### One-time GitHub setup

1. Push this repository to GitHub.
2. Open `Settings` -> `Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Push to your default branch to trigger the deploy workflow.

If you want the workflow to try enabling Pages automatically, add a repository secret named `PAGES_ENABLEMENT_TOKEN`:

- Personal access token: needs `repo` scope or Pages write permission.
- GitHub App token: needs `administration:write` and `pages:write`.

### Deployment behavior

- The workflow builds the app and publishes the generated `out/` directory.
- For project pages such as `https://username.github.io/repo-name/`, the app automatically uses `/<repo-name>` as its `basePath` during CI builds.
- For user or organization sites such as `https://username.github.io/`, no `basePath` is applied.

### Custom domain or custom path override

If you want to force a different deployment path, set a repository or workflow environment variable named `BASE_PATH` before the build runs.

Examples:

- Custom domain at the site root: `BASE_PATH=`
- Deploy under a custom subpath: `BASE_PATH=/apps/dong`

## Scripts

```bash
npm run dev
npm run lint
npm run build
```
