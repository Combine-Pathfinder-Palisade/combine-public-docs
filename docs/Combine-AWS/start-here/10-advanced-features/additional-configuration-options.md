# Additional Configuration Options

## Suppress TAP Dashboard Asset Logging

Logging HTTP requests for TAP Dashboard web assets (JavaScript, CSS, images, etc.) can produce high log volume, so by default Combine suppresses these requests from the log. You can control this behavior with the following configuration values:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.tap.log.ignore.request.dashboard.asset` | `true` / `false` | When `true` (the default), suppresses log entries for TAP Dashboard asset requests (`/dashboard/assets`). Set to `false` to log them. |
| `combine.tap.log.ignore.request.success.dashboard` | `true` / `false` | When `true` (the default), suppresses log entries for successful (`2xx`) TAP Dashboard requests (`/dashboard`). Set to `false` to log them. |

## Rewriter and Filter Conditions

Individual API Request/Response Rewriters and Filters can be selectively enabled or disabled based on additional criteria. Each condition takes a space-separated list of values.

### Enable/Disable by Role Name

Rewriters and Filters can be scoped to only apply (or be skipped) when the ARN of the IAM Role used to sign the transaction contains a given value (for example, an IAM Role Name). Refer to the configuration documentation for a specific rewriter for the exact property name; the pattern is:

```
combine.endpoints.aws.rewriter.<rewriter-name>.enable.roleArn.contains
combine.endpoints.aws.rewriter.<rewriter-name>.enable.roleArn.contains.except
```

When `enable.roleArn.contains` is set, the Rewriter or Filter only applies when the Role ARN contains one of the values. When `enable.roleArn.contains.except` is set, the Rewriter or Filter is skipped when the Role ARN contains one of the values. (Filters use the `combine.endpoints.aws.filter.<filter-name>.` prefix instead.)

### Enable/Disable by AWS Account Number

Rewriters and Filters can be force-enabled or disabled for requests from a specific AWS Account Number:

```
combine.endpoints.aws.rewriter.<rewriter-name>.enable.force.accounts
combine.endpoints.aws.rewriter.<rewriter-name>.enable.accounts
combine.endpoints.aws.rewriter.<rewriter-name>.enable.accounts.except
```

`enable.force.accounts` force-enables the Rewriter or Filter for the listed accounts (even if it is otherwise disabled). `enable.accounts` only enables it for the listed accounts. `enable.accounts.except` disables it for the listed accounts.

## Setting Configuration Values

All configuration values above are set in the Combine Configuration DynamoDB table (`combine-configuration`). See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.
