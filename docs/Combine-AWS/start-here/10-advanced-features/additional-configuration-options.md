# Additional Configuration Options

This page collects Configuration Values that do not belong to a single feature: TAP Dashboard request logging, and conditions that scope an individual Rewriter or Filter.

Set these Configuration Values in the Combine Configuration table (the `combine-configuration` DynamoDB table). See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.

## Suppress TAP Dashboard Request Logging

Logging HTTP requests for TAP Dashboard web assets, such as JavaScript, CSS, and images, can produce a high log volume. By default Combine suppresses these requests, and successful TAP Dashboard requests, from the log.

| Configuration Value | Default | Description |
|---|---|---|
| `combine.tap.log.ignore.request.dashboard.asset` | `true` | When `true`, suppresses log entries for TAP Dashboard asset requests (`/dashboard/assets`). Set to `false` to log them. |
| `combine.tap.log.ignore.request.success.dashboard` | `true` | When `true`, suppresses log entries for successful (`2xx`) TAP Dashboard requests (`/dashboard`). Set to `false` to log them. |

## Rewriter and Filter Conditions

You can enable or disable an individual Request Rewriter, Response Rewriter, or Filter based on additional criteria. Each condition takes a space-separated list of values.

The keys below use the Rewriter prefix, `combine.endpoints.aws.rewriter.<rewriter-name>.`. For a Filter, use the `combine.endpoints.aws.filter.<filter-name>.` prefix instead.

### Enable/Disable by Role Name

A Rewriter or Filter can apply, or be skipped, only when the ARN of the IAM Role that signed the AWS API Call contains a given value (for example, an IAM Role Name). For the exact key of a specific Rewriter, refer to that Rewriter's configuration documentation. The keys follow this pattern:

```text
combine.endpoints.aws.rewriter.<rewriter-name>.enable.roleArn.contains
combine.endpoints.aws.rewriter.<rewriter-name>.enable.roleArn.contains.except
```

| Key Suffix | Effect |
|---|---|
| `enable.roleArn.contains` | The Rewriter or Filter only applies when the Role ARN contains one of the values. |
| `enable.roleArn.contains.except` | The Rewriter or Filter is skipped when the Role ARN contains one of the values. |

### Enable/Disable by AWS Account Number

A Rewriter or Filter can be force-enabled or disabled for requests from a specific AWS Account Number:

```text
combine.endpoints.aws.rewriter.<rewriter-name>.enable.force.accounts
combine.endpoints.aws.rewriter.<rewriter-name>.enable.accounts
combine.endpoints.aws.rewriter.<rewriter-name>.enable.accounts.except
```

| Key Suffix | Effect |
|---|---|
| `enable.force.accounts` | Force-enables the Rewriter or Filter for the listed accounts, even if it is otherwise disabled. |
| `enable.accounts` | Enables the Rewriter or Filter only for the listed accounts. |
| `enable.accounts.except` | Disables the Rewriter or Filter for the listed accounts. |
