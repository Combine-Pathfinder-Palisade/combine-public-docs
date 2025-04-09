# 3.14 Runbook

- update combine-provisioning role
- must rebuild bastion server due to change in ssh key.
- if doing a disconnected deployment - 
  - check customer's `clients.json` to see if their clients object be updated with any new values. (maybe the bucket KMS key field?)
  - manually require IMDSv2 on Bastion server, if they are using an instance profile on the EC2 instance in which they're doing the upgrade

Salesforce:
- enable deletion protection for Tap/Endpoints LB
- remember to copy config from JDev as relates to rewriter configs for EKS tags when doing JStage deploy
- we removed the cloudformation flag for Role Masquerade. confirm that environments (such as SStage and SDev) have the desired Role Masquerade setting).
- Ensure that the following config values are set to true: `combine.tap.certificates.user.key.encrypted` and `combine.tap.certificates.server.key.encrypted`

-----

Trello ticket original - https://trello.com/c/b1ryG80x/2051-release-314
