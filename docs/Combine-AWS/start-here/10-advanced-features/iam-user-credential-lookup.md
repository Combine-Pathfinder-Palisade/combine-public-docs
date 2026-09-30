# IAM User Credential Lookup

IAM User Credential Lookup lets Combine proxy a request signed by an IAM User while preserving the caller identity.

The sponsors of emulated Partitions rarely allow IAM Users, but occasionally a workload needs one. When Combine proxies a request, it must infer the IAM Credentials that signed that request (see [Rewriting](../5-orientation.md#rewriting) in Orientation). An IAM User cannot be assumed like an IAM Role, so you must register the IAM User's credentials with Combine (in AWS Secrets Manager by default). Once the lookup is enabled and the credentials are registered, Combine can proxy requests signed by that IAM User.

## Configuration

Set this Configuration Value in the Combine Configuration table. See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.

Starting with Combine 3.14.2, IAM User Credential Lookup is enabled by default.

| Configuration Value | Default | Description |
|---|---|---|
| `combine.endpoints.aws.authorization.iamUser.credentials.lookup` | `true` | Set to `false` to disable IAM User Credential Lookup. |

_NOTE: Before Combine 3.14.2, the lookup was disabled by default. You enabled it by setting `combine.endpoints.aws.authorization.userCredential.lookup` to `true`._

## Registering IAM User Credentials

Once IAM User Credential Lookup is enabled, you must register the IAM Credentials of each IAM User with Combine.

### Automatic Registration

If the Access Key for your IAM User was created through Combine (with an `iam:CreateAccessKey` API Call sent to the emulated AWS IAM API Endpoint), Combine registers your IAM User Credentials automatically.

### Manual Registration

If the Access Key for your IAM User was not created through Combine, register the IAM Credentials yourself. Where you register them depends on the storage backend of your Combine Deployment.

#### AWS Secrets Manager (Default)

Create a Secret in AWS Secrets Manager with the following Name, where `<shardId>` is your Shard ID in lower case:

`combine/<shardId>/authorization/user/credentials/key/secret/<accessKeyId>`

For example, for the `accessKeyId` `AKIA123123123123`:

| Shard ID | Secret Name |
|---|---|
| `dev` | `combine/dev/authorization/user/credentials/key/secret/AKIA123123123123` |
| _(blank)_ | `combine/authorization/user/credentials/key/secret/AKIA123123123123` |

Set the value of the Secret to the `secretAccessKey` of the IAM User, as a String.

#### DynamoDB

If your Combine Deployment has been migrated to the DynamoDB storage backend (see [Notes](#notes)), add an item to the `combine-credential-cache-iam-users` DynamoDB table instead (`combine-<shardId>-credential-cache-iam-users` if you have a Shard ID). Give the item these String attributes:

- `AccessKeyId`: the `accessKeyId` of the IAM User
- `SecretAccessKey`: the `secretAccessKey` of the IAM User

## Limitations

- Combine only looks up Access Keys that begin with `AKIA` (IAM User Access Keys).
- Each Endpoint Server caches a failed lookup for 30 seconds (`combine.authorization.iamUsers.credentials.storage.cache.duration.negative`), so Combine can take up to 30 seconds to honor a newly registered credential.

## Notes

- Before Combine 3.14.2, a latent issue with the IAM User Credential Lookup could cause throttling under heavy load, due to a restrictive AWS Service Quota. Use caution when you enable the lookup on earlier Combine versions.
- Combine 3.14.2 added a DynamoDB storage backend for IAM User Credentials. The `migrate_iam_user_credentials_to_dynamodb` Combine Command copies each registered Secret from AWS Secrets Manager to the DynamoDB table, optionally deletes the migrated Secrets, and switches the storage backend to DynamoDB. You must restart the Endpoint Servers to apply the change. The command offers to start an Instance Refresh.
