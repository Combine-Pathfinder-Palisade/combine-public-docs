---
sidebar_position: 3
title: Topology - Multiple VPC
---

# Topology - Multiple VPC

## Architecture

Use this topology when your workload must span multiple VPCs, and even multiple AWS Accounts.

In this topology, Combine is deployed to each VPC in your workload. Route 53 private DNS entries redirect all emulated endpoint traffic to the local Endpoint Servers.

## Architecture Diagram

![Multiple VPC Architecture](/aws/combine_network_architecture_multiple_vpc.png)

_NOTE: This diagram is for Combine AWS, but from a networking perspective it is analogous to Combine Azure._

## Advantages

- This architecture is simple and predictable.
- Each AWS Account can be configured independently.

## Disadvantages

- At present, User Management can be performed only in a single designated AWS Account. Combine calls this account the "User Management Account" and calls the other AWS Accounts "Follower Accounts". (See [Add Follower Account](../../../tutorials/operations-self-service-deployment/how-to-add-follower-account.md).)
- At present, the Alert Events for an AWS Account are displayed only on the TAP Dashboard of that AWS Account. We are designing a new architecture for the TAP Dashboard with the capability for multiple accounts and multiple tenants.
- AWS spend is higher because additional infrastructure is deployed to each VPC.

## Shared Responsibilities

- None.
