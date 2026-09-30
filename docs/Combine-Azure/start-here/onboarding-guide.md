---
sidebar_position: 1
title: Onboarding Guide
description: How to prep your subscription for Combine Azure.
---

# Combine Azure Onboarding Guide

![Combine Azure Logo](/azure/combine-azure-logo.png)

This guide explains how to prepare your Subscription so that we can deploy Combine Azure to it: what to expect from a Combine deployment, and the three things we need from you before we deploy.

## What to Expect

- **Region**: Unless you'd like a different region, Combine is deployed in either the **East US** or the **US Gov Virginia** region, depending on which Azure cloud your Subscription is located in.
- **Cost**: Running Combine in your Subscription costs between $200 and $350 per month. We are working to lower this cost and anticipate steep savings in the near future.
- **Policies**: Combine's policies considerably restrict resource creation in the Subscription. For this reason, we recommend that you deploy Combine in a Subscription that is not used for active development or testing.
  - Optionally, we can restrict policy creation to one or more Resource Groups, provided they exist before Combine is deployed. If you give us the resource IDs of the Resource Groups you plan to test your workload in, we assign our policies to include only those Resource Groups.
- **Network**: By default, Combine deploys one VNet. See [Default VNet](#default-vnet).

### Default VNet

The default VNet has an address space of `10.3.0.0/16`, which allows for 65,536 IP addresses, with the following subnet scheme:

| Subnet Name          | Used by Combine? | Address Space   | Available IPs |
| -------------------- | ---------------- | --------------- | ------------- |
| `Combine-Core`       | Yes              | `10.3.0.0/24`   | Dynamic       |
| `Combine-Functions`  | Yes              | `10.3.1.0/24`   | Dynamic       |
| `Combine-Ingress`    | Yes              | `10.3.2.0/25`   | Dynamic       |
| `Combine-Public`     | Yes              | `10.3.2.128/25` | Dynamic       |
| `AzureBastionSubnet` | No               | `10.3.4.0/23`   | 507           |
| `Combine-Customer-A` | No               | `10.3.101.0/24` | 251           |
| `Combine-Customer-B` | No               | `10.3.102.0/24` | 251           |
| `Combine-Customer-C` | No               | `10.3.103.0/24` | 251           |
| `Combine-Customer-D` | No               | `10.3.104.0/24` | 251           |

You are free to deploy your resources in the `Combine-Customer-*` subnets. The other subnets are used for Combine's internal operations. If your workload cannot be deployed inside this scheme, we can alter the subnet configuration as needed.

## Deploying Combine to Your Subscription

To deploy Combine to your Subscription, we need three things:

1. Increased Subscription quotas for virtual CPUs and the App Service Plan.
2. A Service Principal with the appropriate permissions.
3. Your deployment preferences, including any preferences from [What to Expect](#what-to-expect).

### 1. Increase Quota Limit

Increase the vCPU quota from the default (10) to at least 14. You can do this in the Azure Portal by following Microsoft's instructions to [request an increase for regional vCPU quotas](https://docs.microsoft.com/en-us/azure/azure-portal/supportability/regional-quota-requests#request-an-increase-for-regional-vcpu-quotas). We've found that, on average, Microsoft approves this quota increase within a few minutes.

To save on costs, we use an [App Service Plan](https://learn.microsoft.com/en-us/azure/app-service/overview-hosting-plans) running on the cheapest tier, the `S1` tier. You may need to request a quota increase for it. You can do this with the Azure CLI:

```bash
az quota update \
  --scope "/subscriptions/<subscription-id>/providers/Microsoft.Web/locations/<region-id>" \
  --resource-name S1 \
  --limit-object value=10
```

This also generally takes a few minutes, unless the region you'd like to deploy in is having capacity issues.

To check on the quota request, run the following CLI command:

```bash
az quota request list --scope "/subscriptions/<subscription-id>/providers/Microsoft.Web/locations/<region-id>"
```

### 2. Create Service Principal

To provision and manage Combine resources in your Subscription, we need a Service Principal.

The default role assignment for service principals is `Owner`. Combine needs to create an identity with the `Contributor` role within the Subscription, and in Microsoft's AD hierarchy a Contributor can't create another Contributor. For this reason, the only role that the Service Principal can assume in this case is `Owner`.

If `Owner` is not an option for your company's security posture, you can create the identity yourself with the required role assignments and share that identity's information with us. Combine can integrate that identity into its deployment, which allows the Service Principal to have only `Contributor` permissions on the Subscription.

There are two paths for assigning permissions to this Service Principal:

1. Create the Service Principal with `Owner` permissions.
2. Create the Service Principal with `Contributor` permissions. This path requires you to create a Managed Identity with a few role assignments and give us that identity's name and Resource Group name.

In either case, sign in to the target Subscription as a Global Administrator and run the following command to create the Service Principal:

```bash
az ad sp create-for-rbac --skip-assignment --name <service-principal-name>
```

For example, you can name the Service Principal `Sequoia-Combine`.

When the principal is created successfully, the command returns the following response:

```json
{
    "appId": "<app-id>",
    "displayName": "<sp-name>",
    "name": "<same-as-app-id>",
    "password": "secret-password-we-need",
    "tenant": "<tenant-id>"
  }
```

We need the output from this command, as well as the Subscription ID.

To give the Service Principal the `Owner` role (role ID `8e3af657-a8ff-443c-a75c-2fe8c4bcb635`), run the following CLI command:

```bash
az role assignment create --assignee "<app-id>" --role "8e3af657-a8ff-443c-a75c-2fe8c4bcb635" --scope "subscriptions/<sub-id>"
```

Alternatively, to give the Service Principal the `Contributor` role, run this command:

```bash
az role assignment create --assignee "<app-id>" --role "b24988ac-6180-42a0-ab88-20f7382dd24c" --scope "subscriptions/<sub-id>"
```

To make sure the Service Principal was assigned the correct role, list its role assignments:

```bash
az role assignment list --assignee <app-id>
```

The response should contain one assignment:

```json
[
  {
    "canDelegate": null,
    "condition": null,
    "conditionVersion": null,
    "description": null,
    "id": "/subscriptions/<subscription-id>/providers/Microsoft.Authorization/roleAssignments/<role-assignment-id>",
    "name": "<role-assignment-id>",
    ...
    "roleDefinitionId": "/subscriptions/<subscription-id>/providers/Microsoft.Authorization/roleDefinitions/8e3af657-a8ff-443c-a75c-2fe8c4bcb635",
    "roleDefinitionName": "Owner", // OR "Contributor"
    "scope": "/subscriptions/<subscription-id>",
    "type": "Microsoft.Authorization/roleAssignments"
  }
]
```

#### Create the Managed Identity (Contributor Path Only)

If you chose to create the Service Principal with `Contributor` permissions, create the Managed Identity with three role assignments:

- `Contributor`
- `Log Analytics Reader`
- `Storage Account Contributor`

The Azure documentation describes how to [create a Managed Identity with the Azure CLI](https://learn.microsoft.com/en-us/cli/azure/identity?view=azure-cli-latest#az-identity-create) and how to [assign a role with the Azure CLI](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-cli#step-4-assign-role).

- Create the identity in the same region that Combine will be deployed in.
- In this case, the Service Principal needs read access to the Resource Group that contains the Managed Identity, that is, `Microsoft.ManagedIdentity/userAssignedIdentities/read`.

After you create the Managed Identity, share the name of the identity and the Resource Group that it resides in with us.

#### Accept the Rocky Linux Terms of Use

We use Rocky Linux 9, an open-source binary equivalent to Red Hat Linux, for our own compute instances. To use these instances in your Subscription, you need to accept the Rocky Linux terms of use with the Azure CLI. The images are free, that is, they have no cost above the normal Azure operating costs. They require an explicit grant from you only because Rocky Linux 9 is an Azure Marketplace image. You can read more on [Rocky Linux's Azure Marketplace listing](https://azuremarketplace.microsoft.com/en-ca/marketplace/apps/resf.rockylinux-x86_64?tab=Overview).

To accept the terms of use for Rocky Linux instances, run:

```bash
az vm image terms accept --publisher resf --offer rockylinux-x86_64 --plan 9-lvm
```

If Rocky Linux 9 is not an option for your Subscription, we are happy to work with you to find another solution.

### 3. Deployment Preferences

We need the following choices for your deployment:

- **Region**: Which Azure region you'd like us to deploy in. Combine can be deployed in any region, but East US is the most stable. We have recently seen capacity issues with all Azure regions.
- **Source and target regions**: The source and target regions of your workload. We support **Commercial to Government**, **Commercial to Secret**, **Commercial to Top Secret**, **Government to Secret**, and **Government to Top Secret**.
- **Compute cost savings**: Whether to enable cost savings on compute instances. This saves some money, but instance startup takes a few seconds.
- **Policy Assignments**: Whether Policy Assignments apply to the Subscription or to a particular set of existing Resource Groups.
- **Subnet scheme**: The [default subnet scheme](#default-vnet), or a scheme modified for your workload's needs.
- **Azure services**: Which Azure services your workload is likely to use, for example ACR, AKS, ACA, and Function Apps.
- **Network topology**: [Which network topology your workload will use](/Combine-Azure/start-here/network-topologies).

Also, let us know if your organization has any security policies or restrictions that we need to be aware of, for example whitelisted IPs or compute instance requirements.

After you complete these three steps (the quota increases, the Service Principal, and your deployment preferences), we can begin deploying Combine Azure to your Subscription.
