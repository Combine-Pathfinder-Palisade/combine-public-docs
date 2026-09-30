# Delete/Uninstall a Combine Deployment

This guide explains how to delete a Combine Deployment and the AWS resources it created, either with the `destroy` command of the Combine automation tool or manually in the AWS Console.

If Termination Protection is enabled on a Combine CloudFormation Stack (the 3.14 tool enables it by default), disable it before you delete that stack.

## Delete With the Combine Automation Tool

If you perform your own deployments with the tool, the 3.14 `destroy` command deletes:

- The Combine VPC CloudFormation Stacks listed in `combineVPCStacks`.
- The Combine Policy and Combine CloudFormation Stacks.
- The contents of the App Storage buckets.
- The Combine DevOps bucket.

In Combine 3.14.7 and later, when you run `destroy` with the profile of a Region that is not the Master Region, it deletes only that Region's Combine VPC and Combine CloudFormation Stacks. (See [Deleting a Multi-Region Deployment](how-to-deploy-multiple-regions.md#deleting-a-multi-region-deployment).)

The `destroy` command does not disable Termination Protection or delete the Combine Secrets in AWS Secrets Manager (see step 10 of [Delete Manually](#delete-manually)). For how to run it, see [Executing Commands](how-to-combine-deployment.md#executing-commands).

## Delete Manually

1. Remove any resources you created within each Combine VPC.
2. Go to the [Amazon S3 Console](https://us-east-1.console.aws.amazon.com/s3/) and empty the `combine-<shard id>-app-storage-<account id>` and `combine-<shard id>-app-storage-<account id>-public` buckets. If you did not set a Shard ID, these are named `combine-app-storage-<account id>` and `combine-app-storage-<account id>-public`. You can delete these buckets if they only contain basic shard information.
3. Go to the [VPC Console](https://us-east-1.console.aws.amazon.com/vpcconsole/home?region=us-east-1#Home:) and perform the following deletions in this order:
   1. Go to [Firewalls](https://us-east-1.console.aws.amazon.com/vpcconsole/home?region=us-east-1#NetworkFirewalls:) from the **Network Firewalls** menu on the left. Filter the list of firewalls for the target Shard ID, select the target firewall, and choose **Delete** in the upper right. Wait for the deletion to complete before you continue.
   2. Go to [Firewall Policies](https://us-east-1.console.aws.amazon.com/vpcconsole/home?region=us-east-1#NetworkFirewallPolicies:) from the menu on the left. Filter for the target Shard ID, select the target policy (for example, `<ShardId>-Combine-Firewall-Private-Policy`), and choose **Delete** in the upper right.
   3. Go to [Network Firewall Groups](https://us-east-1.console.aws.amazon.com/vpcconsole/home?region=us-east-1#NetworkFirewallRuleGroups:) from the menu on the left. Filter for the target Shard ID, select the target rule group (for example, `<ShardId>-Combine-Private-Rule-Allow-Default`), and choose **Delete** in the upper right.
4. Go to the [CloudFormation Console](https://us-east-1.console.aws.amazon.com/cloudformation/) and delete each Combine VPC CloudFormation Stack. Their names are the keys under `combineVPCStacks` in the `clients.json` profile that built them (for example, `Combine-VPC`), and they are also identified by a `CombineId` Output Value of `combine-vpc`.
5. Go to the [EC2 Key Pairs](https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#KeyPairs) console and delete any Combine EC2 Key Pairs. Only Combine Deployments first built before 3.14 have these Key Pairs. They are named `Combine` and `CombineRestricted`, or `Combine<ShardId>` and `Combine<ShardId>Restricted` if you set a Shard ID.
6. If you are on Combine 3.13.1 or earlier, delete any Combine ACM Certificates.
7. Delete the Combine Policy CloudFormation Stack. It is typically named `Combine-Policy` (or `Combine-<ShardId>-Policy`), and is also identified by a `CombineId` Output Value of `combine-policy`.
8. Delete the Combine CloudFormation Stack. It is typically named `Combine` (or `Combine-<ShardId>`). In Combine 3.13.2.1 and later, it is also identified by a `CombineId` Output Value of `combine`.
9. Empty and delete the Combine DevOps bucket. It is named `combine-devops-<account id>-<region id>`, or `combine-<shard id>-devops-<account id>-<region id>` if you set a Shard ID.
10. Go to the AWS Secrets Manager console in the Master Region and delete the Combine Secrets. Their names begin with `combine/<shard id>/` (the Shard ID in lower case). If you did not set a Shard ID, their names begin with `combine/configuration/` or `combine/authorization/`. They include the Certificate Authority passwords and, where used, the email integration, User Management Account, and IAM User credential Secrets. If other Combine Deployments (Shards) share the Account, delete only the Secrets of the Shard you are removing. Secrets Manager waits for a recovery window before it permanently deletes a Secret.
