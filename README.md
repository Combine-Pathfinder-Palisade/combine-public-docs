# combine-docs
Central Location for Combine Documentation


## Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ npm i
```

### Local Development

```
$ npm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.


### Miscellaneous

This repository uses a github access token to deploy a public version of this site, which lives at [public-docs.sequoiacombine.io](https://public-docs.sequoiacombine.io). The access token has a max life of 366 days, after which it will need to be renewed. See [this wiki](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token) to generate a new token.

The DNS records for both this site [docs.sequoiacombine.io](docs.sequoiacombine.io) and the [public-docs.sequoiacombine.io](https://public-docs.sequoiacombine.io) live in our [dev account's Route 53 console](https://us-east-1.console.aws.amazon.com/route53/v2/hostedzones?region=us-east-1#ListRecordSets/ZD3F9THWWHYA3).
