# User-Agent Header Injection

Combine can inject a `SequoiaCombine/<version>` string into the `User-Agent` header of each AWS API Call it handles. This lets downstream AWS services or logging systems identify traffic that has passed through Combine.

## Configuration

Set these Configuration Values in the Combine Configuration table (the `combine-configuration` DynamoDB table). See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.

User-Agent injection is disabled by default. To enable it, set the `enable` Configuration Value to `true`. The other Configuration Values are optional.

| Configuration Value | Default | Description |
|---|---|---|
| `combine.endpoints.aws.rewriter.request.inject.userAgent.combineAgent.enable` | `false` | When `true`, appends `SequoiaCombine/<version>` to the `User-Agent` header of every outbound AWS API Call. Combine leaves a request unchanged if it has no `User-Agent` header or a blank one. |
| `combine.endpoints.aws.rewriter.request.inject.userAgent.combineAgent.enable.services` | _(empty)_ | Space-separated service names. Injects the `User-Agent` string only for these AWS Services. |
| `combine.endpoints.aws.rewriter.request.inject.userAgent.combineAgent.enable.services.except` | _(empty)_ | Space-separated service names. Injects the `User-Agent` string for all AWS Services except these. |
| `combine.endpoints.aws.rewriter.request.inject.userAgent.combineAgent.agent.override` | _(empty)_ | A string that replaces `SequoiaCombine/<version>`. |
