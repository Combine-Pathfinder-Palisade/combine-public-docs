---
sidebar_position: 3
title: Topology - Multiple VNet - Central Combine VNet
---

# Architecture

This Combine Network Architecture is used when your workload must span multiple VNets.

In this architecture Combine is deployed to a single VNet, while your workload is deployed to separate VNets. Route 53 Private DNS entries redirect all emulated endpoint traffic to the Combine VNet through one of several networking mechanisms. At present this architecture has been production-tested with all VNets peered together.

# Architecture Diagram

![Multiple VNet Architecture with Central Combine VNet](/aws/combine_network_architecture_multiple_vpc_central_combine_vpc.png)

_Note that this diagram is for Combine AWS but is analogous to Combine Azure from a networking perspective._


# Advantages

- This architecture is very very scalable.
- This architecture is cost effective for large workloads.

# Disadvantages

- This architecture cannot proxy AKS Cluster traffic unless each cluster has a public API Endpoint.
- This architecture is complex and requires shared responsibilities between you and the Combine Support Team.

# Shared Responsibilities

- You must create/maintain your workload's VNets as well as the peering between your VNets and the Combine VNet.