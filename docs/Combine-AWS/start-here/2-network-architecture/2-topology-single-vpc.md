---
sidebar_position: 2
title: Topology - Single VPC
---

# Architecture Diagram

![Single VPC Architecture](/aws/combine_network_architecture_single_vpc.png)

# Architecture

This is the most commonly used Combine Network Architecture. Combine is deployed to a single VPC. Route 53 Private DNS entries redirect all emulated endpoint traffic to local Combine Endpoint servers.

# Advantages

- This architecture is simple and very very predictable.

# Disadvantages

- None. If your workload spans a single VPC this is the ideal configuration.

# Shared Responsibilities

- None.