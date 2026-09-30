# VPC Wrapping

VPC Wrapping deploys Combine into a VPC that already exists by "wrapping" it, instead of building a new VPC. This lets you deploy Combine without permissions to create network resources.

## What Wrapping Changes

A wrapped VPC otherwise follows the [Combine VPC Architecture](../7-network-architecture/1-vpc-network-architecture.md). When Combine wraps a VPC:

- Combine does not create the VPC, an Internet Gateway, or any Auxiliary CIDR Block associations. The VPC CIDR Block parameters must match the CIDR Blocks the VPC already has.
- The VPC has public internet access only if you provide its Internet Gateway ID. Without one, Combine builds none of its public resources (the Combine Public Subnets, the NAT Gateways, and the Public Combine Firewall).
- By default Combine builds the Combine Subnets inside the VPC from the Combine and Combine Firewall CIDR Blocks. Those CIDR Blocks must fall within the VPC's CIDR Blocks and must not overlap an existing subnet. You can instead build the Combine Subnets yourself in advance and provide their IDs.
- Combine still builds the Combine Firewalls and the AirGap Route Tables: `<VpcName>-Customer-Airgap-Private`, and `<VpcName>-Customer-Airgap` when the VPC has public internet access. Each is prefixed with `<ShardId>-` if you set a Shard ID.
- Your existing workload subnets keep their current Route Tables. To place a workload subnet behind the AirGap, associate it with the appropriate AirGap Route Table (see [AirGap Networking](../7-network-architecture/1-vpc-network-architecture.md#airgap-networking)).
- Combine associates its Route 53 Private Hosted Zones with the wrapped VPC, so the VPC must have DNS support and DNS hostnames enabled (as they are for a VPC that Combine builds).
- If the VPC already routes its Internet Gateway traffic through an existing Network Firewall, set the `IngressRouteTable` parameter to `false` so Combine does not build its own Ingress Route Table.

## CloudFormation Parameters

These CloudFormation Parameters in the Combine VPC CloudFormation Template (`combine-vpc.yaml`) wrap an existing VPC. Set them on the Combine VPC Stack, for example in `clients.json` under `combineVPCStacks` > `<VPC stack name>` (see [Reference - clients.json](../../tutorials/operations-self-service-deployment/reference-clients-json.md)).

| Parameter | Description |
|---|---|
| `WrappedVpc` | Set to `true` to start wrapping a VPC. |
| `WrappedVpcId` | Required. The ID of the VPC to wrap. |
| `VpcCidrBlock`, `VpcCidrBlockAuxiliaryA` through `VpcCidrBlockAuxiliaryD` | Must match the CIDR Blocks of the wrapped VPC. Set `VpcCidrBlock`, and any Auxiliary CIDR Block parameters, accordingly. |
| `WrappedVpcInternetGatewayId` | The Internet Gateway ID of the VPC. Required if the VPC has public internet access. If it is left empty, Combine assumes the VPC has no public internet access. |
| `VpcCombineNetworkingBuild` | When `true` (the default), the template builds each Combine Subnet within the VPC. When `false`, you must build each subnet that Combine uses in advance and provide its ID (see below). |
| `VpcCombineNetworkingBuildPublicAccess` | If the VPC has public internet access, set to `true` (the default) to build public internet access resources. |
| `VpcCombineSubnetPublicA`, `VpcCombineSubnetPublicB` | Subnet IDs, required when `VpcCombineNetworkingBuild` is `false`. |
| `VpcCombineSubnetPrivateA`, `VpcCombineSubnetPrivateB` | Subnet IDs, required when `VpcCombineNetworkingBuild` is `false`. |
| `VpcCombineSubnetPublicFirewallPublicA`, `VpcCombineSubnetPrivateFirewallPublicA`, `VpcCombineSubnetPrivateFirewallPrivateA` | Subnet IDs, required when `VpcCombineNetworkingBuild` is `false`. |
| `VpcCombineSubnetPublicC` through `VpcCombineSubnetPublicF`, `VpcCombineSubnetPrivateC` through `VpcCombineSubnetPrivateF` | Ignore these. They only support a specific legacy customer deployment. |

## Pitfalls

- Combine does not evaluate the actions that were taken while the VPC was built. If one of those actions is not supported in the emulated Region, Combine does not flag it, which can result in a "false positive".
