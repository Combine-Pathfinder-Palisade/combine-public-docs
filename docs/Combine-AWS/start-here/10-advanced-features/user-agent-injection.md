# User-Agent Header Injection

Combine can inject a `SequoiaCombine/<version>` string into the `User-Agent` header of each AWS API Call it handles. This allows downstream AWS services or logging systems to identify traffic that has passed through Combine.

## Enabling User-Agent Injection

User-Agent injection is disabled by default. Enable it by setting the `enable` configuration value below. The remaining configuration values are optional:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.aws.rewriter.request.inject.userAgent.combineAgent.enable` | `true` / `false` | When `true`, appends `SequoiaCombine/<version>` to the `User-Agent` header on every outbound AWS API call (requests without a `User-Agent` header, or with a blank one, are left unchanged) |
| `combine.endpoints.aws.rewriter.request.inject.userAgent.combineAgent.enable.services` | Space-separated service names | Only inject the `User-Agent` string for these AWS Services |
| `combine.endpoints.aws.rewriter.request.inject.userAgent.combineAgent.enable.services.except` | Space-separated service names | Inject the `User-Agent` string for all AWS Services except these |
| `combine.endpoints.aws.rewriter.request.inject.userAgent.combineAgent.agent.override` | String | Replaces `SequoiaCombine/<version>` with this value |

## Setting Configuration Values

These configuration values are set in the Combine Configuration DynamoDB table (`combine-configuration`). See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.
