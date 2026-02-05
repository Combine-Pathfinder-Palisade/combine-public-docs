---
sidebar_position: 2
title: Topology - Multiple VNet
---

# Architecture

This Combine Network Architecture is used when your workload must span multiple VNets.

In this architecture Combine is deployed to each of the VNets in your workload. Private DNS entries redirect all emulated endpoint traffic to local Combine Endpoint servers. The 'Customer' subnets (reserved for your use) are routed to local Combine Proxy machines which act as an airgap.


# Architecture Diagram

![Multiple VNet Architecture](/aws/combine_network_architecture_multiple_vpc.png)

_Note that this diagram is for Combine AWS but is analogous to Combine Azure from a networking perspective._


# Advantages

- This architecture is simple and very very predictable.
- Each VNet can be configured independently.

# Disadvantages


- Higher cloud spend due to additional infrastructure deployed to each VPC.
- Currently each VNet will have it's own independent Combine dashboard, as violation information is not shared between VNets.

# Shared Responsibilities

- None.
