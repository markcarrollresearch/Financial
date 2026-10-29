# Browser-hosted application

The application is a static React web app. The cloud coding session can build and test it, but the tools available in this session do not expose a permanent ChatGPT-hosted preview URL or a file/website publishing service. Publishing a cloud environment snapshot is not publishing a website.

## Prepared option: GitHub Pages

The existing repository can serve this application through GitHub Pages without a paid service or new runtime credentials. The site is generated with `npm run build:site`: it builds the Vite application, copies the build outputs into `docs/`, and writes `.nojekyll`. Original documentation and source CSVs are preserved. All synthetic data and the County logo are served as static assets; no executable or download is needed to use the app.

The intended address, once Pages has been enabled and deployment has completed, is `https://markcarrollresearch.github.io/Financial/`. This address is a deployment target, not a claim that the site is live. The site uses relative asset URLs and hash navigation, so the repository subpath and page refreshes work without a custom server.

## Publication prerequisite

The user previously approved uploading source and ZIPs to GitHub. Public website hosting is a separate action under the original instruction not to publish the application without permission. The prepared site must not be pushed to an active Pages source or enabled for public hosting until that permission is supplied.

After approval and upload, a repository administrator can enable GitHub Pages in Settings → Pages, choose Deploy from a branch, select `financial-lab-delivery`, choose `/docs`, and save. The native Git proxy has been verified for reads and pushes; this does not prove access to the GitHub administration API. If the available tools cannot enable the Pages setting, that single account setting must be completed by the user. Never ask for a GitHub token in chat.

After GitHub reports deployment complete, verify the actual public URL loads, the unfiltered budget is $9,615,367.31, all four views work, source drawers resolve, and the scenario inputs update results. Do not report the website as live until this is checked. On a tablet, the same HTTPS address can be opened in its normal browser and bookmarked.

The published site is public and uses synthetic financial data with the independent-concept disclosure on every view. It is not a County service, has no sign-in or live ledger connection, and does not modify the original Power BI project.
