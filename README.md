# FinOps Scope Builder

Build one FinOps Scope in seven steps, in your browser, then print it or save it as a file.

**Use it:** https://cloud-cost.com/scope-builder

A Scope, in the FinOps Framework, is an area of technology spend that a business decides to manage together: what it covers, what the business wants from it, who takes part, which Capabilities it works on and how mature each has to be. This page walks through those questions for one Scope:

1. **Why this Scope**: the question that started it, and the "why?" behind the question.
2. **Business outcome**: what success looks like, and which of cost, speed and quality the Scope favours.
3. **Technology**: the Technology Categories it covers.
4. **Personas**: who takes part.
5. **Capabilities**: what it will work on.
6. **Maturity and cadence**: where each Capability is today, where it should get to, and how often the Scope is reviewed.
7. **Review**: the sheet, to print or to save.

## It sends nothing anywhere

The page runs in your browser and keeps nothing. There is no sign-in, no cookie, no storage, no analytics and no request to any server after the page has loaded. Close the tab and the Scope is gone, which is why the page asks before you leave with unsaved work.

You do not have to take that on trust:

- The two scripts are short and are in this repository. Neither calls the network or the browser's storage.
- On `cloud-cost.com` the page is served with a Content-Security-Policy that allows this site's own script and no connection to anywhere (`default-src 'none'`, and no `connect-src`). A browser enforces that, whatever the script says.

## The files

| File | What it is |
|---|---|
| `scope-builder.html` | The page, and all of its wording |
| `scope-builder.css` | Its look, and the sheet on paper |
| `scope-builder.js` | Shows one step at a time, fills the sheet, and hands the file to the browser. It holds no wording: it reads every label from the page |
| `scope-builder-file.js` | The rules, with no page in them: what a Scope holds, when a step counts as filled in, and the file that is saved |
| `styles.css` | The stylesheet of `cloud-cost.com`, which the page is drawn with |
| `sample.finops-scope-profile.json` | The file the page saves, for one sample Scope |

These are the files that `cloud-cost.com` serves. They are copied here when the page changes; the page is not developed in this repository.

## Run it from the files

The page asks for its files at the root of a site (`/styles.css`, `/scope-builder.js`), and its script is a module, which a browser does not load from a `file:` address. So serve the folder with any static file server and open the page:

```sh
python3 -m http.server 8080
# then open http://localhost:8080/scope-builder.html
```

Two things differ from the page on `cloud-cost.com`. The fonts are not in this repository: they are Fraunces and IBM Plex, which belong to their own authors under their own licence, and without them the page uses your system's fonts. And the links in the header and the footer lead to pages of `cloud-cost.com` that are not here.

## The file it saves

`finops-scope-profile.json` is plain JSON, and `sample.finops-scope-profile.json` shows one. It holds ids of the FinOps Framework's Personas, Capabilities and Technology Categories, and never their labels, so a file means the same when a label is reworded.

| Field | What it holds |
|---|---|
| `formatVersion` | `2`. A reader refuses a version it does not know |
| `madeWith`, `exportedAt` | What made the file, and when |
| `scopeProfile` | The Scope's name |
| `triggerQuestion`, `whyChain` | The question that started the Scope, and the answers to "why?" |
| `businessOutcome` | What success looks like |
| `tradeoff` | `cost`, `speed` or `quality`. Absent when none is chosen |
| `technologyCategoryIds`, `personaIds`, `capabilityIds` | What was chosen, by id |
| `maturityTargets` | For each chosen Capability: `capabilityId`, `target`, and `current` when today was rated. Each is `crawl`, `walk` or `run` |
| `cadence`, `notes` | How often the Scope is reviewed, and anything else |

## Where it comes from

The page is made by the people behind [ccfinx](https://cloud-cost.com), a FinOps practice-management product, as a free tool for practitioners. ccfinx can open the file this page saves, so a Scope made here is not lost to somebody who later uses it. ccfinx itself is a separate product and is not open source. None of its code is in this repository: the page's code was written for the page.

## The FinOps Framework

The page follows the FinOps Framework's guidance on Scopes. The names of the Domains, Capabilities and Personas are the Framework's own:

"FinOps Framework" by the FinOps Foundation, https://www.finops.org/framework/, licensed under CC BY 4.0, https://creativecommons.org/licenses/by/4.0/. The names are used unchanged. The wording of the steps, their guidance and their examples is this page's own and is not the Foundation's.

This project is not affiliated with, endorsed by or sponsored by the FinOps Foundation.

## Corrections

Found something wrong, or a step that is unclear? Open an issue. A pull request is welcome too; by the licence's section 5, what you send in is under the same licence. Two things to know before you write one:

- The page's wording is kept in step with ccfinx, so a change to the wording of a step may be taken up there first, or not at all.
- The ids in the page (`data-id`, `data-capability`) are what the saved file holds. They do not change.

## A security problem

Please do not open a public issue. Write to security@cloud-cost.com. The site's `security.txt` is at https://cloud-cost.com/.well-known/security.txt.

## Licence

Copyright 2026 Delta Clarity LLC

Licensed under the Apache License, Version 2.0 (the "License"); you may not use these files except in compliance with the License. You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

The full text is in `LICENSE`, and `NOTICE` holds the notices that travel with the files.

**The names are not part of it.** The licence does not grant permission to use the names "ccfinx" and "cloud-cost.com", or their marks, except as needed to say where these files come from (section 6 of the License). If you host a copy of this page, give it a name of your own.
