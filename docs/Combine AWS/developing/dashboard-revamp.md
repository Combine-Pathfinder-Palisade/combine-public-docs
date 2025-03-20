# Dashboard Revamp

Here is where scratch notes and potentially-permanent notes will go for the Dashboard.

## Discussion Topics for Frontend Working Sessions

- should we use a different framework than Angular?
- should we bundle the frontend into the backend api jar?
  - seems like we should, since this works just fine now

## Requirements

- full parity with existing tap dashboard
- what should we do with the UI? Keep the same?

## Wishlist
 
- develop unit testing from the get-go! And we can use AI somehow to get automated tests, and no more of those silly spec.ts files in the components that don’t do anything
- along with unit tests, coverage reports on github
- integration tests using [playwright](https://playwright.dev/)
- release notes page in markdown instead of html
- keep tap-server-mock because it’s awesome
- add a way to test a local frontend against an existing aws account so that we don’t have to push the war up to do integration tests
- stretch goal is to have all dashboards fit in one repo but this might not be feasible for now..
