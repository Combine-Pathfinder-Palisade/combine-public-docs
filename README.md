# combine-docs

The central location for Combine documentation.

## Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

```bash
$ npm i
```

### Local Development

```bash
$ npm run start
```

This command regenerates the Combine API reference (`docs/combine-api/`) from `openapi/openapi.yaml`, then starts a local development server on port 3001 and opens a browser window. Most changes are reflected live without restarting the server.

### Build

```bash
$ npm run build
```

This command regenerates the Combine API reference, then generates static content into the `build` directory. You can serve that directory with any static content hosting service.

### Miscellaneous

This repository uses a GitHub access token to deploy a public version of this site, which lives at [public-docs.sequoiacombine.io](https://public-docs.sequoiacombine.io). The access token has a maximum life of 366 days, after which it must be renewed. To generate a new token, see [Creating a fine-grained personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token) in the GitHub documentation.

The DNS records for both this site ([docs.sequoiacombine.io](https://docs.sequoiacombine.io)) and [public-docs.sequoiacombine.io](https://public-docs.sequoiacombine.io) live in our [dev account's Route 53 console](https://us-east-1.console.aws.amazon.com/route53/v2/hostedzones?region=us-east-1#ListRecordSets/ZD3F9THWWHYA3).
