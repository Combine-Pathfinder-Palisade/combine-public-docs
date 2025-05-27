# Change Additional AWS Services

### Allowing Additional AWS Service

Combine can allow you to add support for an additional AWS Service (for example, if a customer is requesting that an AWS Service be unblocked preemptively or if a customer needs to use a newly released AWS Service before the next Combine release).

To add support for an additional AWS Service you need to:

- Update Combine's Policy layer to add IAM Permissions for the Service.
- Update Combine's Service Filter to allow the API traffic to exit the Combine VPC to the Service.

#### Update Combine Policy Layer

(NOTE: Applies to C2S and SC2S emulations using the US Government Policy Template.)

To add IAM Permissions you should create a separate IAM Policy in the affected account that grants access to the Service or Service Features you desire.

You should then update the Combine Policy CloudFormation Stack. There are a pair of parameters: `CombineServiceAugment` and `CombineServiceAugmentReadOnly`. Set the ARN of the IAM Policy you created as the appropriate paramater.

`CombineServiceAugment` - Will update default roles that have read / write permissions (such as `WLDEVELOPER`).
`CombineServiceAugmentReadOnly` - Will update default roles that have read permissions (such as `TECHNREADONLY`).

You can confirm that the change is successful by using the TAP Dashboard to assume an affected role and confirming that you have access to the AWS Service in the AWS Dashboard.

#### Update Combine Service Filter

To update the Service Filter you need to determine the AWS Service's name. This is the first segment of that AWS Service's Endpoint host. For example:

`ecs.us-east-1.amazonaws.com` - The service name is `ecs`

There are times where the service name is not intuitive, so you can confirm you have the right service name by executing an command from the CLI to that AWS Service inside Combine and looking at the Endpoint Server logs to see what host the call was made too.

The default list of upported AWS Services is defined in the Combine Policy CloudFormation template. It is a Mapping that is written out to a set of Configuration Parameters:

`combine.endpoints.aws.metadata.supportedServices.<region-id>`

If you are adding support for an AWS Service permenantly during a Service Parity update you would update that default list. To update the service list for a specific customer you should use the override Configuration Parameter:

`combine.endpoints.aws.filter.service.unsupported.<region-id>.services`

You should set a value of the space separate list of service names you wish to allow. For example:

`combine.endpoints.aws.filter.service.unsupported.us-iso-east-1.services`=`polly macie`

You can test this change by executing an command from the CLI to that AWS Service inside Combine. It should pass both the Service Filter and IAM Policy layer now.

#### Unblocking a DENY on AWS Service or AWS Service Features

The above instructions handle the case where you are strictly adding access. If a customer asks that we stop blocking an AWS Service or AWS Service Feature the challenge is harder. In AWS IAM a DENY always trumps an ALLOW. If this is an update to Service Parity based on a change on the high side then we should remove the DENY and do a hotfix.

If this is a case where the customer wants to ignore the restriction we need to refer this request to the development team. There are a few options:

-  Add a configuration option to the Combine Policy template to make that particular DENY optiona with an conditional statement.
-  Add a custom role without that restriction and enable it in the TAP Dashboard. (There is some risk as this custom role may fall out of sync with other service parity changes.)

### Blocking Additional AWS Service

In some cases we want to do the reverse and block an additional AWS Service (for example, because the customer is not allowed to use it because of accreditation restrictions.)

In this case, we do the same steps as above except you write a DENY in the custom IAM Policy. Instead of adding the service name to the services list, you add it to the services blocked list:

`combine.endpoints.aws.filter.service.unsupported.<region-id>.services.blocked`
