---
sidebar_position: 2
title: Topology - Single VPC
---

# Topology - Single VPC

## Architecture

This is the most commonly used Combine network topology. In this topology, Combine is deployed to a single VPC. Route 53 private DNS entries redirect all emulated endpoint traffic to the local Endpoint Servers.

## Architecture Diagram

![Single VPC Architecture](/aws/combine_network_architecture_single_vpc.png)

## Advantages

- This architecture is simple and predictable.

## Disadvantages

- None inherently. If your workload runs in a single VPC, this is the ideal configuration. If your workload spans more than one VPC, you must use a different topology, such as [Multiple VPC](2-topology-multiple-vpc.md) or [Multiple VPC - Central Combine VPC](3-topology-multiple-vpc-central-combine-vpc.md).

## Shared Responsibilities

- None.
