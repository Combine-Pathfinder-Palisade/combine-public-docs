---
sidebar_position: 3
title: Topology - Multiple VPC
---

# Architecture

This Combine Network Architecture is used when your workload must span multiple VPCs (and even multiple AWS Accounts).

In this architecture Combine is deployed to each of the VPCs in your workload. Route 53 Private DNS entries redirect all emulated endpoint traffic to local Combine Endpoint servers.

# Architecture Diagram

![Multiple VPC Architecture](/aws/combine_network_architecture_multiple_vpc.png)

# Advantages

- This architecture is simple and very very predictable.
- Each AWS Account can be configured independently.

# Disadvantages

- At present User Management can only be performed in a single designated AWS Account. This account is referred to in Combine as the "root" account.
- At present the Combine Alert Events for an AWS Account are only displayed on the TAP Dashboard of that AWS Account. (_NOTE: We are designing a new architecture for the TAP Dashboard with the capability for multiple accounts and multiple tenants._)
- Higher AWS spend due to additional infrastructure deployed to each VPC.

# Shared Responsibilities

- None.
