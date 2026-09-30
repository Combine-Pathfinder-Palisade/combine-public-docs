# Resource Role Masquerade

Resource Role Masquerade lets Combine assume the IAM Role attached to an AWS resource, such as an EC2 Instance Profile or a Lambda execution role, when it cannot otherwise infer the credentials that signed an AWS API Call. This preserves the caller identity instead of falling back to the Default Role (see [Change the Default Role](../../tutorials/operations-self-service-deployment/how-to-change-default-role.md)).

## How It Works

When Combine proxies an AWS API Call, it must infer the credentials that signed the call (see [Rewriting](../5-orientation.md#rewriting) in Orientation). If it cannot, Combine finds the EC2 Instance or VPC-attached Lambda Function that owns the source private IP address of the request. It then assumes that resource's IAM Role to sign the proxied request.

## Configuration

Set these Configuration Values in the Combine Configuration table (the `combine-configuration` DynamoDB table). See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.

Resource Role Masquerade is enabled by default. You can also turn it on or off in the TAP Dashboard with the **Resource Role Masquerade** toggle, in the **Feature Flags** section of **Admin Settings > TAP Settings > Application Configuration**.

| Configuration Value | Default | Description |
|---|---|---|
| `combine.endpoints.aws.authorization.resourceRole.masquerade` | `true` | Enables or disables Resource Role Masquerade. |
| `combine.endpoints.aws.authorization.resourceRole.masquerade.cacheTime` | `300000` (5 minutes) | How long, in milliseconds, to cache the resource role found for a source IP address, including a failed lookup or role assumption. |
| `combine.endpoints.aws.authorization.resourceRole.masquerade.log.violation` | `true` | When `true`, raises a **Could Not Assume Role** Alert Event when Combine finds a resource role but cannot assume it. |
