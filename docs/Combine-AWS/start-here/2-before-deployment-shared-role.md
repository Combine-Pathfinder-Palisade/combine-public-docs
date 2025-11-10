---
sidebar_position: 2
title: Before Deployment - Shared Role
---

# Shared Role

Before the Combine Team can deploy Combine to the AWS Account you have provided we need you to a deploy a shared IAM Role that we can assume.

This is provided as an [AWS CloudFormation Template](./combine-provisioning.yaml).

### CloudFormation Template

Please deploy the AWS CloudFormation Template above as a AWS CloudFormation Stack preferrably in the same AWS Region that Combine will be deployed in.

(For help deploying the AWS CloudFormation Tempalte please see the relevant [AWS Documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-console-create-stack.html).)

The AWS CloudFormation Stack has been succcessfully deployed please provide the Combine Support Team with the AWS Account ID of the AWS Account.

### CloudFormation Template - Advanced Configuration

The AWS CloudFormation Template has several Configuration Parameters to support several advanced use cases.

- `EnablePermissionsFollowerAccountCredentials` is set to `true` for certain Combine Network Topologies.
- `ProvisioningRoleNameOverride` can be set to change the default name of the Combine Provisioning Role. (Default value is `Combine-Provisioning-Role`.)
- `PrincipalAccount` is set to `true` to allow the Combine Provisioning Role to be assumed from a Combine DevOps account. (Default value is `true`.)
- `PrincipalAccountNumberOverride` can be set to change the default account number for a Combine DevOps account. This can used if you are using the internal automation tool to deploy Combine yourself.
- `PrincipalEC2` is set to `true` if you want to create an EC2 Instance Profile for the Combine Provision Role. This can used if you are using the internal automation tool to deploy Combine yourself.
- `ReadOnlyMode` is set to `true` if you want to restrict the Combine Provision Role to have only `ReadOnlyAccess`. This can be used to limit the Combine Team's access to your account after a deployment if desired.
