---
sidebar_position: 6
title: Known Issues

---

# Known Issues

These are temporary / transient issues that are currently unsolved but for which we expect a resolution in the future.

### TerraForm Support

- Some versions of the TerraForm AWS Provider will not create an Application Load Balancers because it always sends a value for the Desync Mitigation Mode attribute. Since Desync Mitigation Mode is not supported on the high side these calls always fail.

# Known Limitations

These are fundamental limitations of Combine that prevent us from emulating specific behavior or infrastructure.

### IMDS

Combine cannot directly intercept the link local network traffic to the AWS EC2 IMDS service. This means that if your workload tries to read the Region or Partition ID from the EC2 IMDS service, it will not receive an emulated value from Combine.

Recommended Solutions:

- Use a configuration value in your application as shim to avoid using the AWS EC2 IMDS service. (You can also consider using the `AWS_EC2_METADATA_DISABLED` environment variable to limit access to the ECS IMDS service.)
- The Combine Team has developed an EC2 IMDS Proxy service that can be installed locally on a server or as a pod in an EKS Cluster. In most cases this will require you to set the `AWS_EC2_METADATA_SERVICE_ENDPOINT` environment variable to override the default AWS EC2 IMDS service and use the Combine EC2 IMDS Proxy service instead.

### Authentication via `sts:GetCallerIdentity`

There are some cases where a presigned `sts:GetCallerIdentity` is used to authenticate a client to a server within your workload. The client sends a presigned `sts:GetCallerIdentity` which is replayed by the server to confirm the identity of the client.

Due to the fundamental design of the AWS SigV4 signing algorithm, Combine cannot reliably derive and replay the credentials used to presign the `sts:GetCallerIdentity` call except in the following cases:

- The credentials used were issued by the CAP/SCAP service emulated in Combine.
- The credentials used were issued by a call to `sts:AssumeRole` or `sts:AssumeRoleWithWebIdentity` that occurred within a Combine VPC.
- The credentials used were from an IAM User that was registered for use by Combine in Secrets Manager (very very rare).

In all other cases (_such as credentials issued by an EC2 Instance Profile_) Combine cannot replay the credentials causing the Authentication to break.

Recommended Solution:

- The Combine Team recommends that for generating the presigned `sts:GetCallerIdentity` call (and for that only) that you use the non-emulated Region value. Combine will detect the use of a non-emulated credential for that call and will pass it on without attempting to resign the call.

### RDS Endpoint Proxying

Combine cannot directly proxy the SSL / Database Protocol connection between clients and an RDS Instance/Cluster. In the emulated regions however, these connections often use a proprietary Certificate Authority Chain.

Recommended Solution:

- The Combine Team recommends that you ensure that you allow the proprietary Certificate Authority Chain to be configured on clients that use RDS even if they use no other AWS Service.

### CloudFormation Template Analysis

Combine cannot directly proxy the AWS API calls that occur when an AWS CloudFormation Template is executed in an account. Those AWS API calls occur in AWS network space which means Combine cannot validate them or apply rewriting handlers.

Recommended Solution:

- The Combine Team recommends that you carefully review each AWS CloudFormation Template to ensure that it contains no hard coded values that are region/partition specific.

_NOTE: Combine is developing a CloudFormation Template Analyzer that will statically analyze CloudFormation Templates for compliannce. This is expected to debut in the Version 3.14.1 release._

# To Be Aware Of

These are unique situational things to be aware of as you deploy into your production environment.

### Caller Identity

Please consult the Rewriting section of the [Orientation page](orientation) for an explanation of "caller identity" changes that can occur when Combine proxies a transaction.

### Alert Events Suppressed by Default

Due to the shear volume of some Alert Events (formerly Violations) that can be thrown in certain situations (drowning out useful findings), there are several Alert Events that are suppressed by default in Combine:

- Calls to commerical `SSM` endpoint. (The SSM Agent is enabled by default on various AMI images. See [here](../tutorials/deploying-testing/how-to-configure-ssm-agent) for a tutorial on how to properly configure the SSM Agent.)
- Calls to `UDP` Port `123`. (This is the default port for NTP that is enabled on various AMI images.)
- Calls to emphemeral Ports `49152` to `65535`. (In some network configurations the ephemeral port traffic return traffic is incorrectly routed through the AirGap Firewall causing many many false positives.)

### `WLDEVELOPER` Role

If you are in a production environment that uses the `WLDEVELOPER` series enterprise IAM Roles then you might encounter a discrepancy between Combine's `WLDEVELOPER` definition and your production environment's `WLDEVELOPER` definition.

In a production environment that uses it, the `WLDEVELOPER` IAM Role is used by the production environment's sponsor to grant what amounts to the "administrator" permissions for a given account.

It is important to know that the definition of `WLDEVELOPER` _can vary from account to account_ inthe production environment depending on how the production environment's provisioning process. This is because in some cases the production environment's sponsor often has to contractually "order" AWS Services. Only those AWS Services explicitly "ordered" will be included in that account's `WLDEVELOPER` account.

Combine assumes a "maximal" representation of `WLDEVELOPER`... This means Combine assumes that your production environment's sponsor has ordered _all_ AWS Services. If that is not the case you will need to work with you sponsor to add the support for the additional AWS Services to your `WLDEVELOPER` role.
