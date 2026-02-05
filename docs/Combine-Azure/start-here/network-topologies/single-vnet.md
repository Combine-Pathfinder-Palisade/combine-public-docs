---
sidebar_position: 1
title: Topology - Single VNet
---

# Architecture

This is the most commonly used Combine Network Architecture. In this topology Combine is deployed to a single VNet. Private DNS entries redirect all emulated endpoint traffic to local Combine Endpoint servers. The 'Customer' subnets (reserved for your use) are routed to Combine's Proxy machine which acts as an airgap.


# Architecture Diagram

![Single VNet Architecture](/aws/combine_network_architecture_single_vpc.png)

_Note that this diagram is for Combine AWS but is analogous to Combine Azure from a networking perspective._

# Advantages

- This architecture is simple and very very predictable.

# Disadvantages

- None inherently. If your workload spans a single VNet this is the ideal configuration. If your workload spans more than one VPCs then you must use a different topology.

# Shared Responsibilities

- None.