# Change Additional AWS Services

Each Combine release allows a default set of AWS Services in each emulated Region. This guide explains how to allow an additional AWS Service, what to do when an AWS Service or AWS Service feature is blocked by a DENY, and how to block an additional AWS Service.

## Allow an Additional AWS Service

You can add support for an additional AWS Service, for example if you want an AWS Service unblocked preemptively, or you need a newly released AWS Service before the next Combine release.

To add support for an additional AWS Service:

- Update the Combine Policy layer to add IAM permissions for the AWS Service.
- Update the Combine Service Filter to allow the API traffic to leave the Combine VPC for the AWS Service.

### Update the Combine Policy Layer

_NOTE: This applies to C2S, SC2S, and GovCloud emulation, which use the US Government Policy Template._

The Combine Policy CloudFormation Stack has a pair of Parameters for additional IAM Policies:

| Parameter | Console Label | Updates |
| --- | --- | --- |
| `CombineServiceAugment` | **Policy Augment - Service** | Default Roles that have read / write permissions (such as `WLDEVELOPER`). |
| `CombineServiceAugmentReadOnly` | **Policy Augment - Service Read Only** | Default Roles that have read permissions (such as `TECHREADONLY`). |

To add IAM permissions:

1. In the affected Account, create a separate IAM Policy that grants access to the AWS Service or AWS Service features you want.
2. Update the Combine Policy CloudFormation Stack, and set the ARN of that IAM Policy as the appropriate Parameter.
3. To confirm the change, use the TAP Dashboard to assume an affected Role, and check that you can access the AWS Service in the AWS Console.

If you build with the Combine automation tool, its `iamAugment` field can also create this IAM Policy and set `CombineServiceAugment`. (See [IAM Augment Policy](reference-clients-json.md#iam-augment-policy-iamaugment).)

### Update the Combine Service Filter

To update the Service Filter, you need the AWS Service's name. This is the first segment of the AWS Service's Endpoint host. For example, the service name of `ecs.us-east-1.amazonaws.com` is `ecs`.

The service name is not always intuitive. To confirm it, run a CLI command against the AWS Service inside Combine, and check the Endpoint Server logs for the host the call was made to. (See [View Combine Logs](../operations/how-to-view-combine-logs.md#endpoint-logs).)

The default list of supported AWS Services for each emulated Region is the `supportedServices` list for that Region in the Combine Cloud Partition definition file (`cloud-partitions.json`) included in each Combine release. (Before Combine 3.14, this list was a Mapping in the Combine CloudFormation Template, written out to a set of Configuration Values: `combine.endpoints.aws.metadata.supportedServices.<region-id>`.) If a Region's list is empty or contains `all`, the Service Filter allows every AWS Service in that Region.

A permanent addition made during a Service Parity update goes in that default list. To change the list for your Combine Deployment, use the override Configuration Value:

`combine.endpoints.aws.filter.service.unsupported.<region-id>.services`

Set it to a space separated list of the service names you want to allow. For example, set `combine.endpoints.aws.filter.service.unsupported.us-iso-east-1.services` to `polly macie`. (See [Edit Combine Configuration Values](../operations/how-to-edit-combine-configuration.md).)

To test the change, run a CLI command against the AWS Service inside Combine. It should now pass both the Service Filter and the IAM Policy layer.

### Unblock a DENY on an AWS Service or AWS Service Feature

The steps above only add access. Removing a block on an AWS Service or AWS Service feature is harder, because in AWS IAM a DENY always overrides an ALLOW.

- If the block reflects a Service Parity update based on a change on the high side, contact the Combine Support Team. The Combine Team removes the DENY in a hotfix.
- If you want to ignore the restriction, contact the Combine Support Team, who refer the request to the development team. The options are:
  - Add a configuration option to the Combine Policy Template that makes that particular DENY optional with a conditional statement.
  - Add a custom Role without that restriction and enable it in the TAP Dashboard. (See [Add TAP Role Mappings](../administration/how-to-add-tap-role-mappings.md).) There is some risk that this custom Role falls out of sync with other Service Parity changes.

## Block an Additional AWS Service

In some cases you want the reverse: to block an additional AWS Service, for example because accreditation restrictions do not allow you to use it.

Follow the same steps as above, with two differences:

- Write a DENY in the custom IAM Policy.
- Instead of adding the service name to the allowed services list, add it to the blocked services list:

  `combine.endpoints.aws.filter.service.unsupported.<region-id>.services.blocked`
