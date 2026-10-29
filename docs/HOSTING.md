# Browser-hosted application

The application is a static React web app. The cloud coding session can build and test it, but the tools available in this session do not expose a permanent ChatGPT-hosted preview URL or a file/website publishing service. Publishing a cloud environment snapshot is not publishing a website.

## Prepared option: GitHub Pages

The existing repository can serve this application through GitHub Pages without a paid service or new runtime credentials. The site is generated with `npm run build:site`: it builds the Vite application, copies the build outputs into `docs/`, and writes `.nojekyll`. Original documentation and source CSVs are preserved. All synthetic data and the County logo are served as static assets; no executable or download is needed to use the app.

The intended address, once Pages has been enabled and deployment has completed, is `https://markcarrollresearch.github.io/Financial/`. This address is a deployment target, not a claim that the site is live. The site uses relative asset URLs and hash navigation, so the repository subpath and page refreshes work without a custom server.

## Publication authorization and account setting

The user selected GitHub Pages after the agent asked permission to publish a public website. The prepared website can therefore be uploaded to the existing delivery branch. Read [the nontechnical Pages guide](GITHUB_PAGES_GUIDE.md) for the exact account setting.

The native Git proxy has been verified for reads and pushes. An existing `GH_TOKEN` binding was present, but supported `gh api` requests to the repository and Pages endpoints returned `Forbidden` from this session. No credential values were printed or copied. This does not establish that a new token is needed: the remaining action can be performed in the user's signed-in GitHub settings without sharing credentials.

A repository administrator enables GitHub Pages in Settings → Pages, chooses Deploy from a branch, selects `financial-lab-delivery` and `/docs`, and saves. Until that setting is applied and a public check succeeds, the site must be described as prepared/uploaded, not live.

After GitHub reports deployment complete, verify the actual public URL loads, the unfiltered budget is $9,615,367.31, all four views work, source drawers resolve, and the scenario inputs update results. Do not report the website as live until this is checked. On a tablet, the same HTTPS address can be opened in its normal browser and bookmarked.

The published site is public and uses synthetic financial data with the independent-concept disclosure on every view. It is not a County service, has no sign-in or live ledger connection, and does not modify the original Power BI project.
