# IAM User Credential Lookup

While IAM Users are not frequently allowed by the sponsors of emulated Partitions, there are occasional scenarios where they are needed. When Combine is proxying a Request it needs to infer the IAM Credentials that signed that Request (see [Orientation](../5-orientation.md) for a summary of this process under the `Rewriting` section).

Since an IAM User cannot be directly assumed like an IAM Role, the IAM User credentials must be registered with Combine (in AWS Secrets Manager by default) for Combine to access.

## Configuration

Starting with Combine `3.14.2` this integration is enabled by default. It is controlled by the following Configuration Value (set it to `false` to disable the lookup):

`combine.endpoints.aws.authorization.iamUser.credentials.lookup`

(See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.)

_NOTE: Prior to Combine `3.14.2` the integration was disabled by default and was enabled by setting `combine.endpoints.aws.authorization.userCredential.lookup` to `true`._

## IAM User Credential Registration

Once the User Credential Lookup is enabled, the IAM Credentials for the IAM User must be registered with Combine.

### Registration

If the Access Key for your IAM User was created through Combine (via an `iam:CreateAccessKey` API Call sent to the emulated AWS IAM API Endpoint) then Combine will automatically register your IAM User Credentials.

### Registration - Manual

If the Access Key for your IAM User was not created through Combine then you will need to manually register the IAM Credentials in AWS Secrets Manager.

To do this, you must create a Secret with the following Name (where `<shardId>` is your Shard ID in lower case):

`combine/<shardId>/authorization/user/credentials/key/secret/<accessKeyId>`

For example, if your Shard ID is `dev` and your `accessKeyId` is `AKIA123123123123` then the Secret would have the following Name:

`combine/dev/authorization/user/credentials/key/secret/AKIA123123123123`

If your Shard ID is blank, and your `accessKeyId` is `AKIA123123123123` then the Secret would have the following Name:

`combine/authorization/user/credentials/key/secret/AKIA123123123123`

The Secret should have a value of the `secretAccessKey` of the IAM User as a String.

If your Combine Deployment has been migrated to the DynamoDB storage backend (see Notes), add an item to the `combine-credential-cache-iam-users` DynamoDB table (`combine-<shardId>-credential-cache-iam-users` if you have a Shard ID) instead, with a String attribute `AccessKeyId` set to the `accessKeyId` and a String attribute `SecretAccessKey` set to the `secretAccessKey` of the IAM User.

## Conclusion

Once the User Credential Lookup is enabled, and the IAM Credentials for the IAM User are registered, then Combine will be able to proxy a Request signed by that IAM User while preserving the caller identity.

## Notes

Prior to Combine `3.14.2` there was a latent issue with the IAM User Credential lookup that could cause throttling under heavy load due to a restrictive AWS Service Quota. Use caution enabling this on earlier Combine versions.

Only Access Keys that begin with `AKIA` (IAM User Access Keys) are looked up. Each Endpoint Server caches a failed lookup for 30 seconds (`combine.authorization.iamUsers.credentials.storage.cache.duration.negative`), so a newly registered credential can take up to 30 seconds to be honored.

Combine `3.14.2` added a DynamoDB storage backend for IAM User Credentials. The `migrate_iam_user_credentials_to_dynamodb` Combine Command copies each registered Secret from AWS Secrets Manager to the DynamoDB table, optionally deletes the migrated Secrets, and switches the storage backend to DynamoDB. The Endpoint Servers must be restarted to apply the change (the command offers to start an Instance Refresh).
