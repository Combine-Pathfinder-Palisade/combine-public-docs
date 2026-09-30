---
sidebar_position: 4
title: Topology - Multiple VPC - Central Combine VPC
---

# Topology - Multiple VPC - Central Combine VPC

## Architecture

Use this topology when your workload must span multiple VPCs, and even multiple AWS Accounts, at a very large scale.

In this topology, Combine is deployed to a single VPC and your workload is deployed to separate VPCs. Route 53 private DNS entries redirect all emulated endpoint traffic to the Combine VPC through a VPC interconnect.

## Architecture Diagram

![Multiple VPC Architecture with Central Combine VPC](/aws/combine_network_architecture_multiple_vpc_central_combine_vpc.png)

## Advantages

- This architecture is highly scalable. The Combine Support Team has supported up to 200 AWS Accounts attached to a single Combine Deployment.
- This architecture is cost effective for large workloads.

## Disadvantages

- This architecture cannot proxy EKS Cluster traffic unless each EKS Cluster has a public API Endpoint.
- This architecture is complex and requires [shared responsibilities](#shared-responsibilities) between you and the Combine Support Team.

## Shared Responsibilities

You must:

- Create and maintain the VPC interconnect.
- Deploy a Combine Policy template to each AWS Account that is "linked" to the Combine account.
- Deploy a Route 53 Private Hosted Zone that directs traffic to Combine through the VPC interconnect.

## Supported VPC Interconnects

Combine supports several VPC interconnects to move traffic from the Workload VPCs to the Combine VPC:

| VPC Interconnect | Details |
| --- | --- |
| **VPC Peering** | You must also create and maintain additional Route Tables within the Combine VPC. |
| **Transit Gateway** | You must also create and maintain additional Route Tables within the Combine VPC. |
| **PrivateLink** | Combine can expose an AWS PrivateLink service for all emulated endpoints. A Workload VPC can instantiate an AWS PrivateLink VPC Endpoint to communicate with Combine. This does not provide AirGap emulation to the Workload VPC. |
| **Public Load Balancer** | Combine can expose a public Load Balancer that allows access to emulated endpoints. This is not recommended. |
