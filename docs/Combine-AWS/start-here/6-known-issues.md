---
sidebar_position: 6
title: Known Issues

---

# Known Issues and Limitations

This page lists behavior you might encounter in Combine, in three groups: [Known Issues](#known-issues), [Known Limitations](#known-limitations), and situations [To Be Aware Of](#to-be-aware-of).

## Known Issues

These are temporary issues that are currently unsolved but that we expect to resolve in the future. Issues that have since been resolved are marked with the Combine version that resolved them.

### TerraForm Support

- **TerraForm AWS Provider 5.46.0 and above:** The provider always tries to invoke `ec2:DescribeAddressesAttribute` when it manages an Elastic IP resource. This call returns an error on the high side. Combine allows you to stop blocking this call, but the problem persists and requires a TerraForm Provider change or a rearchitecture.
- **Resolved in Combine 3.13.13.1.7:** Some versions of the TerraForm AWS Provider would not create an Application Load Balancer because they always send a value for the Desync Mitigation Mode attribute, which was not supported on the high side. Combine now supports the Desync Mitigation Mode attribute in the US Top Secret Partition (C2S) and the US Secret Partition (SC2S).

### CBOR Support for AWS API Calls

- **Resolved in Combine 3.13.13.1:** Some versions of the AWS SDK use the Concise Binary Object Representation (CBOR) to encode AWS API call request and response bodies. (In the latest SDK version, the CloudWatch SDK client uses only CBOR.) Combine now supports CBOR, so you no longer need to disable it in the AWS SDK. (See the [AWS Documentation](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/client-creation-defaults.html).)

## Known Limitations

These are fundamental limitations of Combine that prevent us from emulating specific behavior or infrastructure.

### IMDS

Combine cannot directly intercept link-local network traffic to the EC2 Instance Metadata Service (IMDS). If your workload reads the Region or Partition ID from IMDS, it does not receive an emulated value from Combine.

**Recommended Solutions:**

- Use a setting in your application's own configuration as a shim instead of reading these values from IMDS. You can also consider using the `AWS_EC2_METADATA_DISABLED` environment variable to limit access to IMDS.
- Use the Combine EC2 IMDS Proxy service, which the Combine Team developed. You can install it locally on a server or as a pod in an EKS Cluster. In most cases, you set the `AWS_EC2_METADATA_SERVICE_ENDPOINT` environment variable to override the default IMDS and use the Combine EC2 IMDS Proxy service instead.

### Authentication via `sts:GetCallerIdentity`

Some workloads use a presigned `sts:GetCallerIdentity` call to authenticate a client to a server. The client sends a presigned `sts:GetCallerIdentity` call, and the server replays it to confirm the client's identity.

Due to the fundamental design of the AWS SigV4 signing algorithm, Combine cannot reliably derive and replay the credentials used to presign the `sts:GetCallerIdentity` call, except in the following cases:

- The credentials were issued by the CAP/SCAP service emulated in Combine.
- The credentials were issued by a call to `sts:AssumeRole` or `sts:AssumeRoleWithWebIdentity` (or, as of Combine 3.14.2, `sts:AssumeRoleWithSAML`, `sts:GetFederationToken`, `sts:GetSessionToken`, or `sts:AssumeRoot`) that occurred within a Combine VPC.
- The credentials belong to an IAM User that was registered for use by Combine in Secrets Manager. This is rare; see [IAM User Credential Lookup](10-advanced-features/iam-user-credential-lookup.md).

In all other cases, such as credentials issued by an EC2 Instance Profile, Combine cannot replay the credentials, and authentication breaks.

**Recommended Solution:**

- The Combine Team recommends that, only for generating the presigned `sts:GetCallerIdentity` call, you use the host Region that your emulated Region is mapped to (for example, `us-east-1`) and the Regional STS Endpoint of that host Region (for example, `sts.us-east-1.amazonaws.com`). Combine detects that the call is signed for the host Region and passes it on to AWS without attempting to re-sign it.

For how Combine handles these calls, including the legacy global STS Endpoint (`sts.amazonaws.com`) and the related Configuration Values, see [Request Reflection](10-advanced-features/request-reflection.md).

### RDS and Other Non-HTTP/S Endpoint Proxying

Combine cannot directly proxy the SSL or database protocol connection between a client and an RDS Instance or Cluster. In the emulated Regions, however, these connections often use a proprietary Certificate Authority chain. The same applies to any other protocol that is not based on HTTP or HTTPS, such as ElastiCache.

**Recommended Solution:**

- The Combine Team recommends that you make sure clients that use RDS can be configured with the proprietary Certificate Authority chain, even if they use no other AWS Service.

### CloudFormation Template Analysis

Combine cannot directly proxy the AWS API calls that occur when a CloudFormation Template is executed in an account. Those AWS API calls occur in AWS network space, so Combine cannot validate them or apply rewriting handlers to them.

**Recommended Solution:**

- The Combine Team recommends that you carefully review each CloudFormation Template to make sure it contains no hard-coded Region- or Partition-specific values.

_NOTE: As of Combine 3.14, the TAP Dashboard includes a Beta **Analyze CloudFormation Template** Combine Tool, on the **Combine Tools** page, that statically analyzes CloudFormation Templates for compliance. It is disabled by default. To enable it, set the `combine.tap.application.feature.tools.analyzeCloudFormationTemplate` Configuration Value (see [Edit Combine Configuration Values](../tutorials/operations/how-to-edit-combine-configuration.md))._

## To Be Aware Of

These are situations to be aware of as you deploy into your production environment.

### Caller Identity

The "caller identity" can change when Combine proxies a transaction. For an explanation, see [Rewriting](5-orientation.md#rewriting) on the Orientation page.

### Alert Events Suppressed by Default

Some Alert Events (formerly Violations) can occur in such volume in certain situations that they drown out useful findings. Combine suppresses these Alert Events by default:

- Calls to the commercial SSM endpoint. The SSM Agent is enabled by default on various AMIs. To configure the SSM Agent properly, see [Configure the SSM Agent](../tutorials/operations/how-to-configure-ssm-agent.md).
- Calls to UDP port `123`. This is the default port for NTP, which is enabled on various AMIs.
- Calls to ephemeral ports `49152` to `65535`. In some network configurations, ephemeral port return traffic is incorrectly routed through the Combine Firewall, which causes many false positives.

### Consistent Use of Service Principals

Combine cannot track the use of Service Principals across requests. For example, if you include a Service Principal such as `ec2.c2s.ic.gov` in an IAM Policy document, Combine can make sure the response reflects the value you sent. However, it cannot guarantee that a later call, such as `GetPolicy`, uses the same Service Principal. When a request contains no explicit Service Principal, Combine defaults to a specific value.

You must therefore use the same Service Principal consistently across all related API calls. Mixing Service Principals across requests produces inconsistent results from Combine.

**Recommended Solution:**

- Choose a single Service Principal and use it consistently across all IAM calls within a given workflow.

#### RDS Service Principal (US Top Secret Partition)

In the US Top Secret Partition (C2S), the RDS Service Principal is now domain optional: `rds.amazonaws.com` (or `rds.<region>.amazonaws.com`) is accepted in addition to the legacy `rds.c2s.ic.gov`.

- Combine 3.14.5 added support for the domain optional RDS Service Principal and began returning `rds.amazonaws.com` by default.
- Combine 3.14.5.6 reverted this change.
- Combine 3.14.6 restored support for `rds.amazonaws.com` but retains the legacy default behavior of returning `rds.c2s.ic.gov` as the RDS Service Principal.

Combine retains the legacy behavior because, as described above, it cannot track which Service Principal was used in earlier requests. Changing the default would suddenly break existing client state (for example, TerraForm state or IAM Policy documents that record `rds.c2s.ic.gov`) and force end users to migrate to `rds.amazonaws.com` immediately.

The legacy behavior is controlled per emulated Region by these Configuration Values:

| Configuration Value | Default |
| --- | --- |
| `combine.endpoints.aws.rewriteOperation.host.servicePrincipal.optionalDomains.override.us-iso-east-1` | `rds` |
| `combine.endpoints.aws.rewriteOperation.host.servicePrincipal.optionalDomains.override.us-iso-west-1` | `rds` |

To disable the legacy behavior (so Combine returns `rds.amazonaws.com`), set both Configuration Values to a blank (empty) value. To restore the legacy behavior, delete the entries or set them back to `rds`. (See [Edit Combine Configuration Values](../tutorials/operations/how-to-edit-combine-configuration.md).)

### `WLDEVELOPER` Role

If your production environment uses the `WLDEVELOPER` series of enterprise IAM Roles, you might encounter a discrepancy between Combine's `WLDEVELOPER` definition and your production environment's `WLDEVELOPER` definition.

In a production environment that uses it, the sponsor uses the `WLDEVELOPER` IAM Role to grant what amounts to "administrator" permissions for a given account.

The definition of `WLDEVELOPER` _can vary from account to account_ in the production environment, depending on its provisioning process. In some cases, the sponsor has to contractually "order" AWS Services, and only the AWS Services explicitly "ordered" are included in that account's `WLDEVELOPER` role.

Combine assumes a "maximal" representation of `WLDEVELOPER`, that is, that your production environment's sponsor has ordered _all_ AWS Services. If that is not the case, work with your sponsor to add support for the additional AWS Services to your `WLDEVELOPER` role.
