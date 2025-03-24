# How To: Delete/Uninstall a Combine Deployment

- Remove any resources you created within each Combine VPC.
- Goto the [Amazon S3 console](https://us-east-1.console.aws.amazon.com/s3/) and empty the `combine-<shard id>-app-storage-<account number>` and `combine-<shard id>-app-storage-<account number>-public` buckets.
- Goto the [CloudFormation console](https://us-east-1.console.aws.amazon.com/cloudformation/) and delete each Combine VPC CloudFormation stack. (These are typically named `Combine-VPC-<Id>` but are also identified by a `CombineId` Output Value of `combine-vpc`.)
- Delete any Combine EC2 Keys. 
  - If shard id was not set these are named `Combine` and `CombineRestricted`.
  - If shard id was set these are named `Combine<ShardId>` and `Combine<ShardId>Restricted`.
- Delete any Combine ACM Certificates (if you are on 3.13.1 or before). 
- Delete the Combine Policy CloudFormation stack. (This is typically named `Combine-Policy` but are also identified by a `CombineId` Output Value of `combine-policy`.)
- Delete the Combine CloudFormation stack. (This is typically named `Combine`. In 3.13.2.1 and later this is also identified by a `CombineId` Output Value of `combine`.)
