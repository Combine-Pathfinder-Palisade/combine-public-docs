# Resource Role Masquerade

Resource Role Masquerade allows Combine to assume the IAM role attached to an AWS resource (such as an EC2 instance profile or Lambda execution role) when it cannot otherwise infer the credentials that signed an AWS API Call. Combine finds the EC2 Instance or VPC-attached Lambda Function that owns the source private IP address of the request and assumes that resource's IAM Role to sign the proxied request. This preserves the caller identity instead of falling back to the default role.

## Enabling Resource Role Masquerade

Resource Role Masquerade is enabled by default. It can be enabled or disabled from the TAP Dashboard with the **Resource Role Masquerade** toggle (under **Admin Settings > TAP Settings > Application Configuration**, in the **Feature Flags** section), or by setting the following configuration value:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.aws.authorization.resourceRole.masquerade` | `true` / `false` | Enable or disable Resource Role Masquerade |

## Additional Options

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.aws.authorization.resourceRole.masquerade.cacheTime` | Duration in milliseconds | How long to cache the resource role found for a source IP address (including a failed lookup or role assumption). Defaults to 300000 (5 minutes) |
| `combine.endpoints.aws.authorization.resourceRole.masquerade.log.violation` | `true` / `false` | When `true` (the default), raises a **Could Not Assume Role** Alert Event when a resource role is found but Combine cannot assume it |

## Setting Configuration Values

All configuration values above are set in the Combine Configuration DynamoDB table (`combine-configuration`). See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.
