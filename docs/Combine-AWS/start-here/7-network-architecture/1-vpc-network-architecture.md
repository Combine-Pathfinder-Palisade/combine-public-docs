---
sidebar_position: 1
title: VPC Network Architecture
---

# Overview

Each Combine VPC emulates a specific Region in your production environment based on the Region it is hosted in.

The network architecture of an _individual_ Combine VPC is discussed below.

The network architecture of _one or more_ Combine VPCs working together in a topology is [discussed here](/category/network-topology).

## Combine VPC Architecture

Each Combine VPC has several basic functions:

- Emulate AirGap Networking
- Emulate AWS API Endpoints
- Emulate API Endpoints (such as CAP/SCAP)

Multiple Combine VPCs might work together in a particular network topology to provide emulation for your entire workload.

### AirGap Networking

Combine routes network egress for each workload subnet via a Route Table to the approprate Combine Firewall. The Combine Firewall has a rule set that controls how traffic is allowed to egress.

Combine can create default workload subnets that are correctly configured for your convenience. If you prefer to create your own subnets, you will need to configure each subnet to use the appropriate Combine Route Table in order to control egress.

### Emulated AWS Service Endpoints

Combine uses a Route 53 Private Hosted Zone to implement the DNS for each emulated AWS Service Endpoint. The DNS Zone routes traffic to an internal Combine Load Balancer for the Combine Endpoint servers which proxy the AWS API calls to/from the hosted Region/Partition.

### Emulated API Endpoints

Combine uses a Route 53 Private Hosted Zone to implement the DNS for each emulated API Endpoint. This DNS Zone routes traffic to an internal Combine Load Balancer for the Combine TAP servers which hosted these Emulated API services.

### Internal Architecture

Each Combine VPC is configured with at least a pair of `/24` CIDR Blocks. It divides these into several groups of subnets:

- _Combine Private Subnets_ - Used to deploy Combine TAP/Endpoint servers and their Load Balancers.
- _Combine Public Subnets_ - Used to deploy Combine TAP Public Load Balancer and the Combine Bastion server.
- _Combine Private Firewall Subnets_ - Used to house the Private Combine Firewall (controls egress for Private Subnets).
- _Combine Public Firewall Subnets_ - Used to house the Public Combine Firewall (controls egress for Public Subnets).

### Internal Architecture Diagram

![Combine VPC Internal Architecture](/aws/combine_vpc_architecture.png)

### Questions

If you have any questions please consult the Combine Support Team!