---
sidebar_position: 1
title: Overview
---

# Overview

Each Combine VPC provides emulation of a restricted region.

The network architecture of the Combine VPC is discussed below.

The external network architecture of combining one or more Combine VPCs into a topology is discussed here:

    - [Combine VPC Toplogy - Single VPC](/start-here/network-architecture/topology-single-vpc)
    - [Combine VPC Toplogy - Multiple VPC](/start-here/network-architecture/topology-multiple-vpc)
    - [Combine VPC Toplogy - Multiple VPC - Central Combine VPC](/start-here/network-architecture/topology-multiple-vpc-central-combine-vpc)

## Combine VPC Architecture

Each Combine VPC has several basic functions:

- Emulate AirGap Networking
- Emulate AWS Service Endpoints
- Emulate API Endpoints (such as CAP/SCAP)

Multiple Combine VPCs might work together in a particular network topology to provide emulation for your workload.

### AirGap Networking

Combine controls network egress for each workload subnet through a Route Table that routes egress traffic to the approprate Combine Firewall. The Combine Firewall has a rule set that controls if or how traffic is allowed to egress.

Combine can create default workload subnets that are correctly configured for your convenience. If you prefer to create your own subnets, you will need to configure each subnet to use the appropriate Combine Route Table in order to control egress.

### Emulated AWS Service Endpoints

Combine uses a Route 53 Private Hosted Zone to implement the DNS for each emulated AWS Service Endpoint. The DNS Zone routes traffic to an internal Combine Load Balancer for the Combine Endpoint servers.

### Emulated API Endpoints

Combine uses a Route 53 Private Hosted Zone to implement the DNS for each emulated API Endpoint. This DNS Zone routes traffic to an internal Combine Load Balancer for the Combine TAP servers.

### Internal Architecture

Each Combine VPC is configured with at least a pair of `/24` CIDR Blocks. It divides these into several groups of subnets:

- Combine Private Subnets. Used to deploy Combine TAP/Endpoint servers and their Load Balancers.
- Combine Public Subnets. Used to deploy Combine TAP Public Load Balancer and the Combine Bastion server.
- Combine Private Firewall Subnets. Used to house the Private Combine Firewall (controls egress for Private Subnets).
- Combine Public Firewall Subnets. Used to house the Public Combine Firewall (controls egress for Public Subnets).

### Internal Architecture Diagram

![Combine VPC Internal Architecture](/aws/combine_vpc_architecture.png)
