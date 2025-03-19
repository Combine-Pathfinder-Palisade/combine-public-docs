# 3.12 Runbook

## Before deployment

~~update the Combine Provisioning credentials (replacing static credentials with the combine-provisioning template where possible) to include new Secrets Manager permissions~~

‌

## During deployment

- Remove `combine.tap.user` and `combine.tap.client` from their config database.
- add values for Tap Domain CAP / Tap Domain SCAP as needed
  - [cia.ic.gov](http://cap.ic.gov "‌")
  - [cap.cia.ic.gov.](http://cap.cia.ic.gov "‌")
  - [nga.smil.mil](http://nga.smil.mil "‌")
  - [geoaxis.nga.smil.mil](http://geoaxis.nga.smil.mil "‌")

‌

## After deployment


**special cases:**

_SF and Cisco: before deployment:_

- create security groups in each VPC for endpoints server “external access” (can match the MAL / multi-account leader security groups for now)
- Add `bricks_v_3_12` to list of blocked tags

_SF and Cisco: during deployment:_

- Set landing zone account id as value of Remote Account ID (replaces TrustedRootAccount)
- Set security group id of security groups as Endpoints External Access Security Group
- SF: Inform them that the parameters have changed when they apply policy template to upstream accounts.

‌
3.12.2:

- Update Endpoints certificate

‌
SalesForce:

- Update AWS API Log settings

-----

Trello ticket original - https://trello.com/c/RVslzGUd/1676-release-312