# AWS API Request Logging

Combine can log the AWS API Requests that pass through it to a DynamoDB table for auditing and analysis. This log is separate from the Combine Log described in [View Combine Logs](../../tutorials/operations/how-to-view-combine-logs.md).

## Enabling AWS API Logging

AWS API Logging is disabled by default. You can turn it on or off in either of these ways:

- In the TAP Dashboard, use the **AWS API Logging** toggle in the **Feature Flags** section of **Admin Settings > TAP Settings > Application Configuration**.
- Set the `combine.endpoints.aws.api.logging.enable` Configuration Value (see [Configuration](#configuration)).

## Log Storage

Combine writes the log to a DynamoDB table named `combine-aws-api-call-log`, or `combine-<shard id>-aws-api-call-log` if your Combine Deployment uses a Shard ID.

Log entries are aggregated rather than stored per request. Combine keeps one item for each combination of AWS Account, AWS Service, and API Action, with these attributes:

- `Count`: the number of matching requests
- `Date`: when Combine first saw the combination, in epoch seconds
- `DateLastSeen`: when Combine last saw the combination, in epoch seconds

## Configuration

Set these Configuration Values in the Combine Configuration table (the `combine-configuration` DynamoDB table). See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.

By default Combine logs requests from every AWS Account and for every AWS Service, and omits failed requests.

| Configuration Value | Default | Description |
|---|---|---|
| `combine.endpoints.aws.api.logging.enable` | `false` | Enables or disables AWS API Request Logging. |
| `combine.endpoints.aws.api.logging.accounts` | _(empty)_ | Space-separated AWS Account IDs. When set, Combine logs only requests from these accounts. |
| `combine.endpoints.aws.api.logging.accounts.except` | _(empty)_ | Space-separated AWS Account IDs. Combine logs requests from every account except these. |
| `combine.endpoints.aws.api.logging.services` | _(empty)_ | Space-separated AWS Service names. When set, Combine logs only requests for these services. |
| `combine.endpoints.aws.api.logging.services.except` | _(empty)_ | Space-separated AWS Service names. Combine logs requests for every service except these. |
| `combine.endpoints.aws.api.logging.ignore.response.status.failed` | `true` | When `true`, Combine does not log failed AWS API Requests (any response status outside of `200`-`299`). Set to `false` to log them. |
| `combine.endpoints.aws.api.logging.table` | Written by CloudFormation | The DynamoDB table where Combine stores log entries. The Combine CloudFormation Template sets it to the table name automatically. |
