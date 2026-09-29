# VPC Wrapping

Combine supports deploying to an already existing VPC by "wrapping" it with Combine. This allows Combine to be deployed without permissions to create network resources.

## What Wrapping Changes

A wrapped VPC otherwise follows the [Combine VPC Architecture](../7-network-architecture/1-vpc-network-architecture.md). When Combine wraps a VPC:

- Combine does not create the VPC, an Internet Gateway, or any Auxiliary CIDR Block associations. The VPC CIDR Block parameters must match the CIDR Blocks the VPC already has.
- The VPC has public internet access only if you provide its Internet Gateway ID. Without one, Combine builds none of its public resources (the Combine Public Subnets, the NAT Gateways, and the Public Combine Firewall).
- By default Combine builds the Combine Subnets inside the VPC from the Combine and Combine Firewall CIDR Blocks, so those CIDR Blocks must fall within the VPC's CIDR Blocks and must not overlap an existing subnet. You can instead build the Combine Subnets yourself in advance and provide their IDs.
- Combine still builds the Combine Firewalls and the AirGap Route Tables (`<VpcName>-Customer-Airgap-Private`, and `<VpcName>-Customer-Airgap` when the VPC has public internet access, each prefixed with `<ShardId>-` if you set a Shard ID). Your existing workload subnets keep their current Route Tables. To place a workload subnet behind the AirGap, associate it with the appropriate AirGap Route Table (see [AirGap Networking](../7-network-architecture/1-vpc-network-architecture.md#airgap-networking)).
- Combine associates its Route 53 Private Hosted Zones with the wrapped VPC, so the VPC must have DNS support and DNS hostnames enabled (as they are for a VPC that Combine builds).
- If the VPC already routes its Internet Gateway traffic through an existing Network Firewall, set the `IngressRouteTable` parameter to `false` so Combine does not build its own Ingress Route Table.

## Configuration Parameters

The following Configuration Parameters are used in the Combine VPC CloudFormation template (`combine-vpc.yaml`) to wrap an existing VPC. They are set on the Combine VPC stack (for example, in `clients.json` under `combineVPCStacks` > `<VPC stack name>`):

- `WrappedVpc`
- `WrappedVpcId`
- `WrappedVpcInternetGatewayId`
- `VpcCombineNetworkingBuild`
- `VpcCombineNetworkingBuildPublicAccess`
- `VpcCombineSubnetPublicA`
- `VpcCombineSubnetPublicB`
- `VpcCombineSubnetPublicC`
- `VpcCombineSubnetPublicD`
- `VpcCombineSubnetPublicE`
- `VpcCombineSubnetPublicF`
- `VpcCombineSubnetPrivateA`
- `VpcCombineSubnetPrivateB`
- `VpcCombineSubnetPrivateC`
- `VpcCombineSubnetPrivateD`
- `VpcCombineSubnetPrivateE`
- `VpcCombineSubnetPrivateF`
- `VpcCombineSubnetPublicFirewallPublicA`
- `VpcCombineSubnetPrivateFirewallPublicA`
- `VpcCombineSubnetPrivateFirewallPrivateA`

To start wrapping a VPC you set `WrappedVpc` to `true`.

You must set `WrappedVpcId` to the ID of the VPC to wrap. You must also set the `VpcCidrBlock` parameter (and any `VpcCidrBlockAuxiliaryA` through `VpcCidrBlockAuxiliaryD` parameters) to match the CIDR Blocks of the wrapped VPC.

If the VPC has public internet access, you must set `WrappedVpcInternetGatewayId` to the Internet Gateway ID of the VPC. If it is left empty, Combine assumes the VPC has no public internet access.

If you want the template to build each Combine Subnet within the VPC you set `VpcCombineNetworkingBuild` to `true` (the default). If the VPC has public internet access, you may also set `VpcCombineNetworkingBuildPublicAccess` to `true` (the default) to build public internet access resources.

If you set `VpcCombineNetworkingBuild` to `false` then you must provide the ID of each subnet that Combine will use. These subnets will need to be built in advance and provided by the customer.

The following parameters are required:

- `VpcCombineSubnetPublicA`
- `VpcCombineSubnetPublicB`
- `VpcCombineSubnetPrivateA`
- `VpcCombineSubnetPrivateB`
- `VpcCombineSubnetPublicFirewallPublicA`
- `VpcCombineSubnetPrivateFirewallPublicA`
- `VpcCombineSubnetPrivateFirewallPrivateA`

_NOTE: The other subnet parameters (ending in `C` through `F`) are only to support a specific legacy customer deployment and should be ignored._

## Pitfalls

- Any actions taken while the VPC was constructed will not be evaluated by Combine. This can result in a "false positive" if such an action is actually not supported in the emulated region but is not evaluated by Combine.


