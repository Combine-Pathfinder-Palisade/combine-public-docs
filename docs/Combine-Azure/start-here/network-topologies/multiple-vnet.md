---
sidebar_position: 2
title: Topology - Multiple VNet
---

# Topology - Multiple VNet

## Architecture

Use this topology when your workload must span multiple VNets.

In this topology, Combine is deployed to each VNet in your workload. Private DNS entries redirect all emulated endpoint traffic to the local Endpoint Servers. The Customer subnets (reserved for your use, see [Default VNet](../onboarding-guide.md#default-vnet)) are routed to local Combine Proxy machines, which act as an airgap.

## Architecture Diagram

![Multiple VNet Architecture](/aws/combine_network_architecture_multiple_vpc.png)

_NOTE: This diagram is for Combine AWS, but from a networking perspective it is analogous to Combine Azure._

## Advantages

- This architecture is simple and predictable.
- Each VNet can be configured independently.

## Disadvantages

- Cloud spend is higher because additional infrastructure is deployed to each VNet.
- At present, each VNet has its own independent Combine Dashboard, because violation information is not shared between VNets.

## Shared Responsibilities

- None.
