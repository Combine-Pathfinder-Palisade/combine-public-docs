# Feature: VPC Wrapping

Combine will support deploying to an already existing VPC by "wrapping" it with Combine. This allows Combine to be deployed without permissions to create network resources.

## Configuration Parameters

The following Configuration Parameters are used in the Combine VPC CloudFormation template to wrap an existing VPC:

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

You must set `WrappedVpcId` to the ID of the VPC to wrap.

If the VPC has public internet access, you must set `WrappedVpcInternetGatewayId` to the Internet Gateway ID of the VPC.

If you want the template to build each Combine Subnet within the VPC you set `VpcCombineNetworkBuild` to `true`. If the VPC has public internet access, you may also set `VpcCombineNetworkingBuildPublicAccess` to `true` to build public internet access resources.

If you set `VpcCombineNetworkBuild` to `false` then you must provide the ID of each subnet that Combine will use. These subnets will need to be built in advance and provided by the customer.

The following configuration values are required:

- `VpcCombineSubnetPublicA`
- `VpcCombineSubnetPublicB`
- `VpcCombineSubnetPrivateA`
- `VpcCombineSubnetPrivateB`
- `VpcCombineSubnetPublicFirewallPublicA`
- `VpcCombineSubnetPrivateFirewallPublicA`
- `VpcCombineSubnetPrivateFirewallPrivateA`

_NOTE: The other subnet configuration values (ending in `C` through `F`) are only to support a specific legacy customer deployment and should be ignored._

## Pitfalls

- Any actions taken while the VPC was constructed will not be evaluated by Combine. This can result in a "false positive" if such an action is actually not supported in the emulated region but is not evaluated by Combine.


