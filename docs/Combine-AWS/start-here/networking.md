---
sidebar_position: 2
---

:::tip[Work-In-Progress]

🚧 This page is actively being updated.

:::

# Combine Networking

Now that you've achieved access into the Combine bastion, how do you actually get your workload into the environment?

----

## Networking Basics

**We highly recommend deleting the default VPC that AWS provisions in the account, as traffic within that VPC cannot be emulated by Combine.**

Combine deploys its own VPC, inside of which your workload should go.

Here's a Combine VPC resource map:
![Combine VPC Resource Map](/aws/vpc-resource-map.png)

Please do not provision any resources inside the subnets with the `RESTRICTED` suffix, as those subnets are reserved for Combine's infrastructure.

You are free to provision in any of the other subnets, named after the Availability Zones you'll have access to in the reserved regions. Note that Combine can optionally not provision the subnets for your workload if you prefer.

---