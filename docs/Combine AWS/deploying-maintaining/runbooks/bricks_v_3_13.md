# 3.13 Runbook

## Before deployment

- email customers and inform them of the change to proxy server
- copy proxy server allow list
- update provisioning role template
- run `migrate_to_3_13` task
- update CF Templates:
  - Combine Stack - enable lambda functions in GovCloud accounts again
  - Combine-policy Stack - pause and run rebuild_endpoints_certificate task
  - Combine-VPC Stack - 
    - set Endpoints build to false to handle IP space issue
    - clear the Tomcat Override Version variable
    - update the AMI variables for Bastion/Tap/Endpoint
    - set Master Region in VPC template for GovCloud accounts and any account not deployed into us-east-1
    - check Proxy settings and disable Bastion / handle External Security Group for Bastion to match old Proxy settings.
- run `rebuild_endpoints_certificate` task
- execute instance refresh
- rebuild user bundles. notify customers that bastion ip has changed.
- add whitelisted domain names to Combine Firewall allow list

## Special cases

Salesforce:

- Translate:

```
combine.endpoints.aws.sts.getCallerIdentity.kubernetes.kind.enable=false
combine.endpoints.aws.sts.getCallerIdentity.kubernetes.kind.configuration.targetRegion=us-east-1
combine.endpoints.aws.sts.getCallerIdentity.kubernetes.kind.configuration.targetHost=sts.amazonaws.com
combine.endpoints.aws.sts.getCallerIdentity.kubernetes.kind.configuration.headers.list.default.enable=true
combine.endpoints.aws.sts.getCallerIdentity.kubernetes.kind.configuration.headers.list=
```

to their new equivalents:

```
combine.endpoints.aws.request.reflection.environment.default
combine.endpoints.aws.request.reflection.target.region.default
combine.endpoints.aws.request.reflection.target.region.endpoint.default
combine.endpoints.aws.request.reflection.headers.default
combine.endpoints.aws.request.reflection.headers
```

- pay special attention to `combine.endpoints.aws.request.reflection.target.region.endpoint.override `
  - make sure it matches the old `targetHost` parameter!

‌

- Disable the Combine Firewall (not needed in their env)

---

Trello ticket original - https://trello.com/c/hnEc4KiO/1811-release-313