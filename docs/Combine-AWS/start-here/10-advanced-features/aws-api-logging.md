# AWS API Request Logging

Combine can log AWS API Requests passing through it to a DynamoDB table for auditing and analysis.

## Enabling AWS API Logging

AWS API Logging is disabled by default. It can be enabled or disabled from the TAP Dashboard under **Settings > AWS API Logging**, or by setting the following configuration value:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.aws.api.logging.enable` | `true` / `false` | Enable or disable AWS API Request Logging |

## Filtering by AWS Account

By default, all accounts are logged. You can restrict logging to specific AWS Account IDs:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.aws.api.logging.accounts` | Comma-separated account IDs | Only log requests from these accounts |
| `combine.endpoints.aws.api.logging.accounts.except` | Comma-separated account IDs | Log all accounts except these |

## Filtering by AWS Service

You can restrict logging to specific AWS Services:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.aws.api.logging.services` | Comma-separated service names | Only log requests for these services |
| `combine.endpoints.aws.api.logging.services.except` | Comma-separated service names | Log all services except these |

## Ignoring Failed Requests

By default, failed AWS API Requests are included in the log. You can configure Combine to omit failed requests:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.aws.api.logging.ignore.response.status.failed` | `true` / `false` | When `true`, failed API requests are not written to the log |

## Log Storage

Logs are written to a DynamoDB table. The table name can be configured:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.aws.api.logging.table` | DynamoDB table name | The table where API log entries are stored |

## Setting Configuration Values

All configuration values above are set in the Combine Configuration DynamoDB table (`combine-configuration`). See [Edit Combine Configuration Values](../../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions on how to update configuration values.
