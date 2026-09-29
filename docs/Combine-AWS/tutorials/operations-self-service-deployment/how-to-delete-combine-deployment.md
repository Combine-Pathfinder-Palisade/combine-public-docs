# Delete/Uninstall a Combine Deployment

(If you perform your own deployments with the Combine automation tool, the 3.14 `destroy` command deletes the Combine VPC CloudFormation stacks listed in `combineVPCStacks`, the Combine Policy and Combine CloudFormation stacks, the contents of the app storage buckets, and the Combine DevOps bucket. In Combine 3.14.7 and later, when run with the profile of a Region that is not the Master Region, it deletes only that Region's Combine VPC and Combine CloudFormation stacks (see [Multi-Region Deployment](how-to-deploy-multiple-regions.md)). It does not disable Termination Protection or delete Combine secrets in AWS Secrets Manager. See [Combine Deployment Process](how-to-combine-deployment.md).)

If Termination Protection is enabled on a Combine CloudFormation stack (the 3.14 automation tool enables it by default), disable it before deleting that stack.

- Remove any resources you created within each Combine VPC.
- Go to the [Amazon S3 console](https://us-east-1.console.aws.amazon.com/s3/) and empty the `combine-<shard id>-app-storage-<account number>` and `combine-<shard id>-app-storage-<account number>-public` buckets. (If shard id was not set these are named `combine-app-storage-<account number>` and `combine-app-storage-<account number>-public`.)
  - These buckets can be deleted if they only contain basic shard information
- Go to the [VPC Console](https://us-east-1.console.aws.amazon.com/vpcconsole/home?region=us-east-1#Home:)
- Perform the following deletions IN ORDER!
  - Go to [Firewalls](https://us-east-1.console.aws.amazon.com/vpcconsole/home?region=us-east-1#NetworkFirewalls:) from the "Network Firewalls" menu on the left
    - Filter for the target ShardID in the list of firewalls
    - Select the radio button next to the target firewall and click "Delete" in the upper right
    - Wait for deletion to complete before proceeding to the next stage
  - Next go to [Firewall Policies](https://us-east-1.console.aws.amazon.com/vpcconsole/home?region=us-east-1#NetworkFirewallPolicies:) from the menu on the left
    - Filter for the target ShardID
    - Ex: `<ShardId>-Combine-Firewall-Private-Policy`
    - Click the checkbox next to the target policy and click "Delete" in the upper right
  - Next go to [Network Firewall Groups](https://us-east-1.console.aws.amazon.com/vpcconsole/home?region=us-east-1#NetworkFirewallRuleGroups:) from the menu on the left
    - Filter for the target ShardID
    - Ex: `<ShardId>-Combine-Private-Rule-Allow-Default`
    - Click the checkbox next to the target rule group and click "Delete" in the upper right.
- Go to the [CloudFormation console](https://us-east-1.console.aws.amazon.com/cloudformation/) and delete each Combine VPC CloudFormation stack. (These are typically named `Combine-VPC-<Id>` but are also identified by a `CombineId` Output Value of `combine-vpc`.)
- Go to the [EC2 Key Pairs](https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#KeyPairs) console and delete any Combine EC2 Keys. (Only Combine Deployments first built before 3.14 have these keys.)
  - If shard id was not set these are named `Combine` and `CombineRestricted`.
  - If shard id was set these are named `Combine<ShardId>` and `Combine<ShardId>Restricted`.
- Delete any Combine ACM Certificates (if you are on 3.13.1 or before). 
- Delete the Combine Policy CloudFormation stack. (This is typically named `Combine-Policy` (or `Combine-<ShardId>-Policy`) but is also identified by a `CombineId` Output Value of `combine-policy`.)
- Delete the Combine CloudFormation stack. (This is typically named `Combine` (or `Combine-<ShardId>`). In 3.13.2.1 and later this is also identified by a `CombineId` Output Value of `combine`.)
- Empty and delete the Combine DevOps bucket. (This is named `combine-devops-<account number>-<region>`, or `combine-<shard id>-devops-<account number>-<region>` if shard id was set.)
