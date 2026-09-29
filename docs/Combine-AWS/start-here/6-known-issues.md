---
sidebar_position: 6
title: Known Issues

---

# Known Issues

These are temporary / transient issues that are currently unsolved but for which we expect a resolution in the future. (Issues that have since been resolved are marked with the Combine Version that resolved them.)

### TerraForm Support

- **Resolved in Combine Version 3.13.13.1.7:** Some versions of the TerraForm AWS Provider would not create an Application Load Balancer because they always send a value for the Desync Mitigation Mode attribute, which was not supported on the high side. Combine now supports the Desync Mitigation Mode attribute in the US Top Secret and US Secret Partitions.

- `TerraForm AWS Provider version 5.46.0 and above` : Tries to always invoke `ec2:DescribeAddressesAttribute` when managing an Elastic IP resource. This call gives an error on the high side. Combine allows you to stop blocking this call but the problem is persistent requiring a TerraForm Provider change or rearchitecture. 

### CBOR Support for AWS API Calls

- **Resolved in Combine Version 3.13.13.1:** Some versions of the AWS SDK have started using the Concise Binary Object Representation (CBOR) for AWS API call request/response body encoding. (In the latest SDK Version, the CloudWatch SDK Client only uses CBOR.) Combine now supports CBOR, so it no longer needs to be disabled in the AWS SDK. (See [AWS Documentation](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/client-creation-defaults.html).)

# Known Limitations

These are fundamental limitations of Combine that prevent us from emulating specific behavior or infrastructure.

### IMDS

Combine cannot directly intercept the link local network traffic to the AWS EC2 IMDS service. This means that if your workload tries to read the Region or Partition ID from the EC2 IMDS service, it will not receive an emulated value from Combine.

Recommended Solutions:

- Use a configuration value in your application as shim to avoid using the AWS EC2 IMDS service. (You can also consider using the `AWS_EC2_METADATA_DISABLED` environment variable to limit access to the EC2 IMDS service.)
- The Combine Team has developed an EC2 IMDS Proxy service that can be installed locally on a server or as a pod in an EKS Cluster. In most cases this will require you to set the `AWS_EC2_METADATA_SERVICE_ENDPOINT` environment variable to override the default AWS EC2 IMDS service and use the Combine EC2 IMDS Proxy service instead.

### Authentication via `sts:GetCallerIdentity`

There are some cases where a presigned `sts:GetCallerIdentity` is used to authenticate a client to a server within your workload. The client sends a presigned `sts:GetCallerIdentity` which is replayed by the server to confirm the identity of the client.

Due to the fundamental design of the AWS SigV4 signing algorithm, Combine cannot reliably derive and replay the credentials used to presign the `sts:GetCallerIdentity` call except in the following cases:

- The credentials used were issued by the CAP/SCAP service emulated in Combine.
- The credentials used were issued by a call to `sts:AssumeRole` or `sts:AssumeRoleWithWebIdentity` (or, as of Combine Version 3.14.2, `sts:AssumeRoleWithSAML`, `sts:GetFederationToken`, `sts:GetSessionToken`, or `sts:AssumeRoot`) that occurred within a Combine VPC.
- The credentials used were from an IAM User that was registered for use by Combine in Secrets Manager (very very rare).

In all other cases (_such as credentials issued by an EC2 Instance Profile_) Combine cannot replay the credentials causing the Authentication to break.

Recommended Solution:

- The Combine Team recommends that for generating the presigned `sts:GetCallerIdentity` call (and for that only) that you use the host Region that your emulated Region is mapped to (for example `us-east-1`) and the Regional STS Endpoint of that host Region (for example `sts.us-east-1.amazonaws.com`). Combine will detect that the call is signed for the host Region and will pass it on to AWS without attempting to resign the call.

See [Request Reflection](10-advanced-features/request-reflection.md) for how Combine handles these calls, including the legacy global STS Endpoint (`sts.amazonaws.com`) and the related Configuration Values.

### RDS and other non-HTTP/s Endpoint Proxying

Combine cannot directly proxy the SSL / Database Protocol connection between clients and an RDS Instance/Cluster. In the emulated regions however, these connections often use a proprietary Certificate Authority Chain. This applies as well to any other non-HTTP/s based protocol, like Elasticache.

Recommended Solution:

- The Combine Team recommends that you ensure that you allow the proprietary Certificate Authority Chain to be configured on clients that use RDS even if they use no other AWS Service.

### CloudFormation Template Analysis

Combine cannot directly proxy the AWS API calls that occur when an AWS CloudFormation Template is executed in an account. Those AWS API calls occur in AWS network space which means Combine cannot validate them or apply rewriting handlers.

Recommended Solution:

- The Combine Team recommends that you carefully review each AWS CloudFormation Template to ensure that it contains no hard coded values that are region/partition specific.

_NOTE: As of Combine Version 3.14 the TAP Dashboard includes a Beta `Analyze CloudFormation Template` Combine Tool (on the `Combine Tools` page) that statically analyzes CloudFormation Templates for compliance. It is disabled by default and can be enabled with the `combine.tap.application.feature.tools.analyzeCloudFormationTemplate` Configuration Value._

# To Be Aware Of

These are unique situational things to be aware of as you deploy into your production environment.

### Caller Identity

Please consult the Rewriting section of the [Orientation page](orientation) for an explanation of "caller identity" changes that can occur when Combine proxies a transaction.

### Alert Events Suppressed by Default

Due to the sheer volume of some Alert Events (formerly Violations) that can be thrown in certain situations (drowning out useful findings), there are several Alert Events that are suppressed by default in Combine:

- Calls to commercial `SSM` endpoint. (The SSM Agent is enabled by default on various AMI images. See [here](../tutorials/operations/how-to-configure-ssm-agent) for a tutorial on how to properly configure the SSM Agent.)
- Calls to `UDP` Port `123`. (This is the default port for NTP that is enabled on various AMI images.)
- Calls to ephemeral Ports `49152` to `65535`. (In some network configurations the ephemeral port return traffic is incorrectly routed through the AirGap Firewall causing many many false positives.)

### Consistent Use of Service Principals

Combine cannot track the use of Service Principals across requests. For example, if you include a Service Principal such as `ec2.c2s.ic.gov` in an IAM Policy document, Combine can ensure the response reflects the value you sent. However, it cannot guarantee that a subsequent call — such as `GetPolicy` — will use the same Service Principal. In the absence of an explicit Service Principal in a request, Combine will default to a specific value.

This means that customers must consistently use the same Service Principal across all related API calls. Mixing Service Principals across requests will produce inconsistent results from Combine.

Recommended Solution:

- Choose a single Service Principal and use it consistently across all IAM calls within a given workflow.

#### RDS Service Principal (US Top Secret Partition)

In the US Top Secret Partition the RDS Service Principal is now domain optional: `rds.amazonaws.com` (or `rds.<region>.amazonaws.com`) is accepted in addition to the legacy `rds.c2s.ic.gov`.

- Combine `3.14.5` added support for the domain optional RDS Service Principal and began returning `rds.amazonaws.com` by default.
- Combine `3.14.5.6` reverted this change.
- Combine `3.14.6` restored support for `rds.amazonaws.com` but retains the legacy default behavior of returning `rds.c2s.ic.gov` as the RDS Service Principal.

Combine retains the legacy behavior because, as described above, it cannot track which Service Principal was used in earlier requests. Changing the default would suddenly break existing client state (for example TerraForm state or IAM Policy documents that record `rds.c2s.ic.gov`) and force end users to migrate to `rds.amazonaws.com` immediately.

The legacy behavior is controlled per emulated Region by these Configuration Values:

| Configuration Value | Default |
| --- | --- |
| `combine.endpoints.aws.rewriteOperation.host.servicePrincipal.optionalDomains.override.us-iso-east-1` | `rds` |
| `combine.endpoints.aws.rewriteOperation.host.servicePrincipal.optionalDomains.override.us-iso-west-1` | `rds` |

To disable the legacy behavior (so Combine returns `rds.amazonaws.com`), set both Configuration Values to a blank (empty) value. To restore the legacy behavior, delete the entries or set them back to `rds`. (See [Edit Combine Configuration Values](../tutorials/operations/how-to-edit-combine-configuration.md).)

### `WLDEVELOPER` Role

If you are in a production environment that uses the `WLDEVELOPER` series enterprise IAM Roles then you might encounter a discrepancy between Combine's `WLDEVELOPER` definition and your production environment's `WLDEVELOPER` definition.

In a production environment that uses it, the `WLDEVELOPER` IAM Role is used by the production environment's sponsor to grant what amounts to the "administrator" permissions for a given account.

It is important to know that the definition of `WLDEVELOPER` _can vary from account to account_ in the production environment depending on the production environment's provisioning process. This is because in some cases the production environment's sponsor often has to contractually "order" AWS Services. Only those AWS Services explicitly "ordered" will be included in that account's `WLDEVELOPER` role.

Combine assumes a "maximal" representation of `WLDEVELOPER`... This means Combine assumes that your production environment's sponsor has ordered _all_ AWS Services. If that is not the case you will need to work with your sponsor to add the support for the additional AWS Services to your `WLDEVELOPER` role.
