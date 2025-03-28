# 3.14 Runbook

- update combine-provisioning role
- must rebuild bastion server due to change in ssh key.
- if doing a disconnected deployment - 
  - check customer's `clients.json` to see if their clients object be updated with any new values. (maybe the bucket KMS key field?)
  - manually require IMDSv2 on Bastion server, if they are using an instance profile on the EC2 instance in which they're doing the upgrade

Salesforce:
- enable deletion protection for Tap/Endpoints LB
- remember to copy config from JDev as relates to rewriter configs for EKS tags when doing JStage deploy


-----

Trello ticket original - https://trello.com/c/b1ryG80x/2051-release-314
