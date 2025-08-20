---
sidebar_position: 3
title: Topology - Multiple VPC
---

# Architecture Diagram

![Multiple VPC Architecture](/aws/combine_network_architecture_multiple_vpc.png)

# Architecture

This architecture is for when your workload is more complex and spans multiple VPCs (and even multiple AWS Accounts).

In this architecture Combine is deployed to each workload VPC. Route 53 Private DNS entries redirect all emulated endpoint traffic to local Combine Endpoint servers.

# Advantages

- This architecture is simple and very very predictable.
- Each AWS Account can be configured separately.

# Disadvantages

- At present User Management can only be performed in a single designated AWS Account. This account is referred in Combine as the "root" account.
- At present Combine Alert Events are only displayed per AWS Account that TAP Dashboard. So the TAP Dashboard(s) in each AWS Account only show the Alert Events for that AWS Account.
- Higher AWS spend due to additional infrastructure deployed to each VPC.

# Shared Responsibilities

- None.
