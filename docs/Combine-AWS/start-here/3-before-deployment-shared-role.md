---
sidebar_position: 3
title: Before Deployment - Shared Role
---

# Shared Role

Before the Combine Team can deploy Combine to the AWS Account you provide, you deploy a shared IAM Role that we can assume. We provide this role as an AWS CloudFormation Template.

## CloudFormation Template

1. Deploy the [CloudFormation Template](./combine-provisioning.yaml) as a CloudFormation Stack, preferably in the same AWS Region where Combine will be deployed. For help, see the AWS documentation on [creating a CloudFormation Stack from the console](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-console-create-stack.html).
2. After the CloudFormation Stack deploys successfully, give the Combine Support Team the AWS Account ID of the AWS Account.

## CloudFormation Template - Advanced Configuration

The CloudFormation Template has several CloudFormation Parameters that support advanced use cases:

| CloudFormation Parameter | Description |
| --- | --- |
| `EnablePermissionsFollowerAccountCredentials` | Set to `true` for certain Combine network topologies. |
| `ProvisioningRoleNameOverride` | Changes the default name of the Combine Provisioning Role. The default name is `Combine-Provisioning-Role`. |
| `PrincipalAccount` | Set to `true` to allow the Combine Provisioning Role to be assumed from a Combine DevOps account. The default value is `true`. |
| `PrincipalAccountNumberOverride` | Changes the default account number for the Combine DevOps account. Use this if you deploy Combine yourself with the internal automation tool. |
| `PrincipalEC2` | Set to `true` to create an EC2 Instance Profile for the Combine Provisioning Role. Use this if you deploy Combine yourself with the internal automation tool. |
| `ReadOnlyMode` | Set to `true` to restrict the Combine Provisioning Role to `ReadOnlyAccess`. Use this to limit the Combine Team's access to your account after a deployment, if desired. |
