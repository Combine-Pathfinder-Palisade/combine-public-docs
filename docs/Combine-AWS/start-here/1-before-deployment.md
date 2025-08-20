---
sidebar_position: 1
title: Before Deployment
---

# Before Deployment


There are several decisions to make prior to deploying Combine. Where not directed otherwise the Combine Team will apply sensible defaults.

### Access

The first decision is who should perform the Combine Deployment? The Combine Team will typically perform the Combine Deployment based on a shared role we assume in your account.

If this is not allowed, then we can provide support to your Team to use our automation tool to perform the Combine Deployment. (Please note this will reduce the timeliness of our Combine updates and also our response to support issues.)

### Network Architecture

You will need to decide on your Combine Network Architecture. See Network Architecture pages for more detail. By default we will deploy a Single VPC Network Architecture.

### VPC Configuration

By default we will deploy Combine VPC(s) according to your specifications. There is an option to "wrap" an existing VPC with Combine. Please reach out to the Combine Support Team if you would like to explore that option.

You will need to decide on your VPC configuration and layout in the AWS Partition (AWS or AWS GovCloud) that is hosting Combine.

- What region(s) should Combine emulated? Which host region should each emulated region be hosted in?
    - By default we will deploy the primary emulated region Combine into `us-east-1` for AWS or `us-gov-west-1` for AWS GovCloud.
- How many VPCs should Combine create? What VPC CIDR ranges should Combine create for each VPC?
    - By default we will deploy a single VPC with a 10.0.0.0/16 VPC CIDR Block.
- For each VPC do you want to enable **public subnet support** for your workload?
- For each VPC do you want Combine to create default subnets for your convenience?
    - By default we create 6 **private** subnets across 3 Availability Zones.
    - By default we create 3 **public** subnets across 3 Availabilit Zones if public subnet support is enabled.
    - You may instead choose to create your own subnets. If so **you must use the provided Combine route tables to enable airgap emulation**.

### VPC Configuration - Optional

There are several optional VPC Configuration options that are not required but that you may want to be aware of:

