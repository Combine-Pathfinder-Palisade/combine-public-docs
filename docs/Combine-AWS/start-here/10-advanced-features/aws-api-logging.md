# AWS API Request Logging

Combine can log AWS API Requests passing through it to a DynamoDB table for auditing and analysis.

## Enabling AWS API Logging

AWS API Logging is disabled by default. It can be enabled or disabled from the TAP Dashboard with the **AWS API Logging** toggle (under **Admin Settings > TAP Settings > Application Configuration**, in the **Feature Flags** section), or by setting the following configuration value:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.aws.api.logging.enable` | `true` / `false` | Enable or disable AWS API Request Logging |

## Filtering by AWS Account

By default, all accounts are logged. You can restrict logging to specific AWS Account IDs:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.aws.api.logging.accounts` | Space-separated account IDs | Only log requests from these accounts |
| `combine.endpoints.aws.api.logging.accounts.except` | Space-separated account IDs | Log all accounts except these |

## Filtering by AWS Service

You can restrict logging to specific AWS Services:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.aws.api.logging.services` | Space-separated service names | Only log requests for these services |
| `combine.endpoints.aws.api.logging.services.except` | Space-separated service names | Log all services except these |

## Ignoring Failed Requests

By default, failed AWS API Requests (any response status outside of `200`-`299`) are omitted from the log. You can configure Combine to include failed requests:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.aws.api.logging.ignore.response.status.failed` | `true` / `false` | When `true` (the default), failed API requests are not written to the log. Set to `false` to log them. |

## Log Storage

Logs are written to a DynamoDB table named `combine-aws-api-call-log` (or `combine-<shard id>-aws-api-call-log` if your Combine Deployment uses a Shard ID). The Combine CloudFormation template sets the following configuration value to the table name automatically:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.aws.api.logging.table` | DynamoDB table name | The table where API log entries are stored |

Log entries are aggregated rather than stored per request. Combine keeps one item for each AWS Account, AWS Service, and API Action combination, with a `Count` of matching requests, the `Date` the combination was first seen, and the `DateLastSeen` (both in epoch seconds).

## Setting Configuration Values

All configuration values above are set in the Combine Configuration DynamoDB table (`combine-configuration`). See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions on how to update configuration values.
