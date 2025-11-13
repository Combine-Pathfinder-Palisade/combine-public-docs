---
sidebar_position: 2
title: Topology - Single VPC
---

# Architecture

This is the most commonly used Combine Network Architecture. In this topology Combine is deployed to a single VPC. Route 53 Private DNS entries redirect all emulated endpoint traffic to local Combine Endpoint servers.

# Architecture Diagram

![Single VPC Architecture](/aws/combine_network_architecture_single_vpc.png)

# Advantages

- This architecture is simple and very very predictable.

# Disadvantages

- None inherently. If your workload spans a single VPC this is the ideal configuration. If your workload spans more than one VPCs then you must use a different topology.

# Shared Responsibilities

- None.