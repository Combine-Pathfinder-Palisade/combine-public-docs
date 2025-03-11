---
title: About this site
description: Learn more about us
---

# About This Site

Hello!

This site will serve as the one-stop location for all resources for the Combine team. It should cover:

- new team member prep and onboarding
- tutorials and documentation on our products
- maintenance and support for our products

### Origins

This site came about during our migration from CodeCommit to Github in December 2024. Heretofore the Combine team employed a number of tools to facilitate daily operations, namely trello, VSCode repos, an excel spreadsheet.

This site exists to hopefully consolidate all the information from the above into a single location.

### How it's built

This site is built with [Docusaurus](https://docusaurus.io/), a documentation repo built by Facebook that has a wealth of plugins and treats [markdown](https://www.markdownguide.org/) files as first-class citizens. 

Please take some time to research, it's a nifty framework.

There are plenty of tutorials online to get you up-to-speed on Docusaurus, but for our purposes, that is, the purpose of adding or editing new docs:
- most pages have an `📝 Edit this page` link which will let you edit the page in the github repo
- to add a directory to the docs, simply add a directory under `/docs` wherever the new content needs to go

### How to use

Additions and edits should be made as frequently as possible!

A more precise style guide will be determined soon, but for now here are a few concise tips on how to do so with style:
- use [markdown niceties](https://www.markdownguide.org/)
- give a lot of whitespace between content
- use screenshots and images as much as possible, especially in the [how-tos category](/category/how-tos).

### How it's Deployed

The deployment pipeline is still being worked out, but it will involve [Github Actions](https://docs.github.com/en/actions) to deploy a new version of the site every time we push to the main branch.

### Security Best Practices

Sequoia expects customers to adhere to our [Security Best Practices](/security).