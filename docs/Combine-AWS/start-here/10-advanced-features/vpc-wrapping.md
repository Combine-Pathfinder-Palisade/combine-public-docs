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
| `VpcCombineNetworkingBuild` | When `true` (the default), the template builds each Combine Subnet within the VPC. When `false`, you must build each subnet that Combine uses in advance and provide its ID (see below), and Combine builds none of its public subnets or NAT Gateways, whatever `VpcCombineNetworkingBuildPublicAccess` is set to. Before Combine 3.15.2, also set `VpcCombineNetworkingBuildPublicAccess` to `false`. |
| `VpcCombineNetworkingBuildPublicAccess` | If the VPC has public internet access, set to `true` (the default) to build public internet access resources. Ignored when `VpcCombineNetworkingBuild` is `false`. |
| `VpcCombineSubnetPublicA`, `VpcCombineSubnetPublicB` | Subnet IDs for the internet-facing TAP and Endpoint Load Balancers. Required when the VPC has public internet access and `VpcCombineNetworkingBuild` or `VpcCombineNetworkingBuildPublicAccess` is `false`. |
| `VpcCombineSubnetPrivateA`, `VpcCombineSubnetPrivateB` | Subnet IDs, required when `VpcCombineNetworkingBuild` is `false`. |
| `VpcCombineSubnetPublicFirewallPublicA`, `VpcCombineSubnetPrivateFirewallPrivateA` | Subnet IDs, required when `VpcCombineNetworkingBuild` is `false`. See also [Private Combine Firewall Routing](#private-combine-firewall-routing). |
| `VpcCombineSubnetPublicC` through `VpcCombineSubnetPublicF`, `VpcCombineSubnetPrivateC` through `VpcCombineSubnetPrivateF` | Ignore these. They only support a specific legacy customer deployment. |

## Private Combine Firewall Routing

Combine builds the NAT Gateway that carries the Private Combine Firewall's traffic out, and the routes that bring the replies back through it, only when it builds its public network resources. If you do not provide `WrappedVpcInternetGatewayId`, or you set `VpcCombineNetworkingBuild` or `VpcCombineNetworkingBuildPublicAccess` to `false`, provide these routes yourself:

1. **Outbound:** route `0.0.0.0/0` from the Private Combine Firewall's subnet to your NAT Gateway or Transit Gateway. If Combine builds that subnet, set `CombineFirewallPrivateRouteTablePrivate` to a Route Table that has this route. Otherwise, add it to the Route Table of the subnet you provide as `VpcCombineSubnetPrivateFirewallPrivateA`.
2. **Return:** in the Route Table of the subnet that holds your NAT Gateway or Transit Gateway attachment, replace the `local` route of each VPC CIDR Block with a route to the Private Combine Firewall's VPC Endpoint. Add the same route for any other CIDR Block whose traffic leaves through the Private Combine Firewall, such as a VPC attached through the Transit Gateway. Without these routes, replies skip the Private Combine Firewall, so it sees only one direction of each connection.

The Private Combine Firewall's VPC Endpoint exists only after the Combine VPC Stack is created, so add the return routes after the Stack is created. The endpoint ID is the part after the `:` in the Stack Output `CombineFirewallPrivateEndpointIds`.

## Pitfalls

- Combine does not evaluate the actions that were taken while the VPC was built. If one of those actions is not supported in the emulated Region, Combine does not flag it, which can result in a "false positive".
