# Additional Configuration Options

## Suppress TAP Dashboard Asset Logging

By default, Combine logs HTTP requests for TAP Dashboard web assets (JavaScript, CSS, images, etc.). This can produce high log volume. You can suppress these requests from the log:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.tap.logging.suppress.assets` | `true` / `false` | When `true`, suppresses log entries for TAP Dashboard asset requests |

## Rewriter and Filter Conditions

Individual API Request/Response Rewriters and Filters can be selectively enabled or disabled based on additional criteria.

### Enable/Disable by Role Name

Rewriters and Filters can be scoped to only apply (or be skipped) when a specific IAM Role Name was used to sign the transaction. Refer to the configuration documentation for a specific rewriter for the exact property name; the pattern is:

```
combine.endpoints.aws.rewriter.<rewriter-name>.roleArn.enable
combine.endpoints.aws.rewriter.<rewriter-name>.roleArn.disable
```

### Enable/Disable by AWS Account Number

Rewriters and Filters can be force-enabled or disabled for requests from a specific AWS Account Number:

```
combine.endpoints.aws.rewriter.<rewriter-name>.account.enable
combine.endpoints.aws.rewriter.<rewriter-name>.account.disable
```

## Setting Configuration Values

All configuration values above are set in the Combine Configuration DynamoDB table (`combine-configuration`). See [Edit Combine Configuration Values](../../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.
