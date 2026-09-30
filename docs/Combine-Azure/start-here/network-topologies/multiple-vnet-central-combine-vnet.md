---
sidebar_position: 3
title: Topology - Multiple VNet - Central Combine VNet
---

# Topology - Multiple VNet - Central Combine VNet

## Architecture

Use this topology when your workload must span multiple VNets.

In this topology, Combine is deployed to a single VNet and your workload is deployed to separate VNets. Azure Private DNS entries redirect all emulated endpoint traffic to the Combine VNet through one of several networking mechanisms. At present, this topology has been production-tested with all VNets peered together.

## Architecture Diagram

![Multiple VNet Architecture with Central Combine VNet](/aws/combine_network_architecture_multiple_vpc_central_combine_vpc.png)

_NOTE: This diagram is for Combine AWS, but from a networking perspective it is analogous to Combine Azure._

## Advantages

- This architecture is highly scalable.
- This architecture is cost effective for large workloads.

## Disadvantages

- This architecture cannot proxy AKS cluster traffic unless each cluster has a public API endpoint.
- This architecture is complex and requires [shared responsibilities](#shared-responsibilities) between you and the Combine Support Team.

## Shared Responsibilities

- You must create and maintain your workload's VNets, as well as the peering between your VNets and the Combine VNet.
