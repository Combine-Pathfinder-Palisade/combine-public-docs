---
sidebar_position: 2
title: Before Deployment
---

# Before Deployment

There are several decisions to make before Combine can be deployed.

### AWS Account Access

The first decision is who will perform the Combine Deployment?

The typical path is for the Combine Team to perform the Combine Deployment based on a [shared IAM Role](before-deployment-shared-role) we assume in an AWS Account you provide. The Combine Team will perform a white glove installation in the account.

If this is not allowed, then the Combine Team can provide support to your Team to use our interal automation tool to perform the Combine Deployment. (Please note this will reduce the timeline of our Combine updates and also our response times for support issues.)

### Network Architecture

Based on a discussion with the Combine Team you will need to decide on a Combine VPC Topology. See [Network Architecture](/category/network-architecture) page for more detail.

By default the Combine Deployment will use a Single VPC topology.

### VPC Configuration

By default the Combine Deployment will create each Combine VPC according to any specifications you provided. This most commonly matches what while happen in the production environment as the production environment's sponsor typically controls VPC creation.

There is an option to instead ["wrap"](advanced-features/vpc-wrapping) an existing VPC with Combine. Please reach out to the Combine Support Team if you would like to explore that option.

You may choose your VPC configuration and layout in the AWS Partition (AWS or AWS GovCloud) that is hosting Combine.

- What region(s) should Combine emulate? Which host region should each emulated region be hosted within?
    - By default we will deploy the primary emulated region into `us-east-1` for AWS or `us-gov-west-1` for AWS GovCloud.
- How many VPCs should Combine create? What VPC CIDR ranges should Combine create for each VPC?
    - By default we will deploy a single VPC with a 10.0.0.0/16 VPC CIDR Block.
- For each VPC do you want to enable **public subnet support** for your workload?
    - By default we will disable public subnet support for cost savings.
- For each VPC do you want Combine to create default subnets for your convenience?
    - By default we create 6 **private** subnets across 3 Availability Zones.
    - By default we create 3 **public** subnets across 3 Availability Zones if public subnet support is enabled.
    - You may choose instead to create your own subnets. _(NOTE: If so you must use the provided Combine Route Table(s) to enable airgap emulation.)_
- What VPC CIDR Block should Combine reserve for itself to deploy Combine's internal resources?
    - By default we use `10.0.254.0/24` and `10.0.255.0/24`. Combine requires at least a pair of `/24` CIDR Blocks.

### VPC Configuration - Optional

There are several optional VPC Configuration options that are not required but that you may want to be aware of:

- You may specify a custom security group to restrict public access to the Combine Dashboard / Bastion.
    - By default this is not set.
    - You create this security group and provide the Combine Team with the Security Group ID. You can then control access to the Combine Dashboard / Bastion via that Security Group once it has been applied to Combine via our AWS CloudFormation templates.
- You may schedule the shutdown of most Combine resources during off hours using a `cron` expression.
    - By default this is `disabled`.
- You may modify the AirGap Emulation be more permissive depending on your Team's needs.
    - By default the AirGap Emulation blocks all outbound traffic.
    - You can choose to allow outbound calls to a specific set of domains and/or in accordance with a set of firewall rules.
    - You can choose to allow outbound calls to any domain but still report each outbound call as an Alert. _(NOTE: This is referred to as Permissive Mode.)_

### Emulation Configuration - Optional

There are many many optional Emulation Configuration options that can be adjusted to conform Combine to your production environment's sponsor. For example:

- You can allow/restrict additional AWS Services.
- You can allow/restrict additional features of AWS Services.
- You can allow/restrict additional means of Authentication/Authorization to AWS IAM.
- For CAP/SCAP enabled emulations you can adjust the duration of the CAP/SCAP Token used to log into the AWS Dashboard.
    - By default this is set to 60 minutes.
    - You can choose to extend this to up to 12 hours. _(NOTE: In the restricted region(s) this requires approval from the restricted region's sponsor.)_

Almost any aspect of the emulation can be configured or extended so please let the Combine Support Team if you have any questions!