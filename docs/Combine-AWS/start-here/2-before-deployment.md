---
sidebar_position: 2
title: Before Deployment
---

# Before Deployment

You make several decisions before Combine is deployed. This page walks through each decision and the default we use if you have no preference.

## AWS Account Access

The first decision is who performs the Combine Deployment.

Typically, the Combine Team performs a white glove installation in an AWS Account you provide. We deploy through a [shared IAM Role](3-before-deployment-shared-role.md) that we assume in that account.

If that is not allowed, the Combine Team can support your team in using our internal [automation tool](../tutorials/operations-self-service-deployment/how-to-combine-deployment.md) to perform the Combine Deployment yourself.

_NOTE: Deploying Combine yourself affects the timeline of our Combine updates and our response times for support issues._

## Network Architecture

Together with the Combine Team, choose a Combine VPC topology. By default, the Combine Deployment uses the [Single VPC](7-network-architecture/2-network-topology/1-topology-single-vpc.md) topology. For all available topologies, see [Network Architecture](/category/network-architecture).

## VPC Configuration

By default, the Combine Deployment creates each Combine VPC to the specifications you provide. This most closely matches your production environment, where the sponsor typically controls VPC creation.

Combine can instead wrap an existing VPC (see [VPC Wrapping](10-advanced-features/vpc-wrapping.md)). Contact the Combine Support Team if you want to explore that option.

You choose the VPC configuration and layout in the AWS Partition that hosts Combine (AWS or AWS GovCloud):

| Decision | Default |
| --- | --- |
| Which Region(s) should Combine emulate, and which host Region should host each emulated Region? | The primary emulated Region is deployed into `us-east-1` for AWS or `us-gov-west-1` for AWS GovCloud. |
| How many VPCs should Combine create, and what VPC CIDR range should each VPC use? | A single VPC with a `10.0.0.0/16` VPC CIDR Block. |
| Should each VPC enable **public subnet support** for your workload? | Disabled, for cost savings. |
| Should Combine create default subnets in each VPC for your convenience? | 6 **private** subnets across 3 Availability Zones, plus 3 **public** subnets across 3 Availability Zones if public subnet support is enabled. |
| Which VPC CIDR Blocks should Combine reserve for its own internal resources? | `10.0.254.0/24` and `10.0.255.0/24`. Combine requires at least a pair of `/24` CIDR Blocks. |

_NOTE: You may choose to create your own subnets instead of the default subnets. If you do, you must use the provided Combine Route Table(s) to enable AirGap emulation._

## VPC Configuration - Optional

You may also want to consider these optional VPC settings:

| Option | Default | Details |
| --- | --- | --- |
| A custom Security Group that restricts public access to the TAP Dashboard / Bastion | Not set | You create the Security Group and give its Security Group ID to the Combine Team. After it is applied to Combine through our CloudFormation Templates, you control access to the TAP Dashboard / Bastion through that Security Group. |
| A scheduled shutdown of most Combine resources during off hours, using a `cron` expression | `disabled` | |
| A more permissive AirGap emulation, depending on your team's needs | Blocks all outbound traffic | You can allow outbound calls to a specific set of domains, in accordance with a set of firewall rules, or both. You can also allow outbound calls to any domain while still reporting each outbound call as an Alert Event (Permissive Mode). See [Configure AirGap Layer](../tutorials/operations/firewall-airgap/how-to-configure-airgap-layer.md). |

## Emulation Configuration - Optional

You can adjust many optional emulation settings to match your production environment's sponsor. For example, you can:

- Allow or restrict additional AWS Services (see [Change Additional AWS Services](../tutorials/operations-self-service-deployment/how-to-change-supported-aws-services.md)).
- Allow or restrict additional features of AWS Services.
- Allow or restrict additional means of authentication and authorization to AWS IAM.
- For CAP/SCAP enabled emulations, adjust the duration of the CAP/SCAP Token used to log in to the AWS Console. The default is 60 minutes, and you can extend it to up to 12 hours. _NOTE: In the restricted Region(s), extending the duration requires approval from the restricted Region's sponsor._

Almost any aspect of the emulation can be configured or extended. Contact the Combine Support Team with any questions.
