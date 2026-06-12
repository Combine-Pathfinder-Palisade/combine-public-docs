# Resource Role Masquerade

Resource Role Masquerade allows Combine to assume the IAM role attached to an AWS resource (such as an EC2 instance profile or Lambda execution role) when evaluating access for that resource. This enables more accurate emulation of resource-based access patterns.

## Enabling Resource Role Masquerade

Resource Role Masquerade is disabled by default. It can be enabled or disabled from the TAP Dashboard under **Settings**, or by setting the following configuration value:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.aws.authorization.resourceRole.masquerade` | `true` / `false` | Enable or disable Resource Role Masquerade |

## Additional Options

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.aws.authorization.resourceRole.masquerade.cacheTime` | Duration in milliseconds | How long to cache the assumed resource role. Defaults to 60000 (60 seconds) |
| `combine.endpoints.aws.authorization.resourceRole.masquerade.log.violation` | `true` / `false` | When `true`, logs cases where resource role assumption is attempted but fails |

## Setting Configuration Values

All configuration values above are set in the Combine Configuration DynamoDB table (`combine-configuration`). See [Edit Combine Configuration Values](../../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.
