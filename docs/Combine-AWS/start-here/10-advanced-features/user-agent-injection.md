# User-Agent Header Injection

Combine can inject a `SequoiaCombine/<version>` string into the `User-Agent` header of each AWS API Call it handles. This allows downstream AWS services or logging systems to identify traffic that has passed through Combine.

## Enabling User-Agent Injection

User-Agent injection is disabled by default. Enable it by setting the following configuration value:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.aws.rewriter.request.inject.userAgent.combineAgent.enable` | `true` / `false` | When `true`, appends `SequoiaCombine/<version>` to the `User-Agent` header on every outbound AWS API call |

## Setting Configuration Values

This configuration value is set in the Combine Configuration DynamoDB table (`combine-configuration`). See [Edit Combine Configuration Values](../../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.
