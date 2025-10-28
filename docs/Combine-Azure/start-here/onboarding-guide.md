---
sidebar_position: 1
title: Onboarding Guide
description: How to prep your subscription for Combine Azure.
---

![Combine Azure Logo](/azure/combine-azure-logo.png)

We are excited to onboard your team to Combine Azure!

## Disclaimers
- Unless you'd like a different region, Combine will be deployed in either the '**US East**' or '**US Gov Virginia**' region, depending on which Azure Cloud your subscription is located in.
- The cost to run Combine in your subscription will run between $200 and $350 dollars per month; we are working to lower this cost and anticipate steep savings in the near future.
- Combine can be deployed with either an [Azure Bastion](https://azure.microsoft.com/en-us/products/azure-bastion) or with both a Linux and Windows Jumpbox VM. The Bastion costs a little more than the jumpboxes but is easier to use, as it requires one less network hop to get to a virtual machine within the Combine network.
- Combine's policies will considerably restrict resource creation in the subscription; for this reason we recommend Combine be deployed in a subscription which is not used for active development and/or testing.
  - Optionally, we can restrict policy creation to one or more resource groups, provided they exist before Combine is deployed. If you give us the resource IDs of the groups you plan to test your workload in, we will assign our policies to include only those groups.
- By default Combine will deploy one Virtual Network with the following properties:
  - Address space of `10.3.0.0/16`, which allows for 65536 IP addresses, with the following subnet scheme:

| Subnet Name         | Used by Combine? | Address Space   | Available IPs |
| ------------------- | ---------------- | --------------- | ------------- |
| Combine-Core        |       YES        | 10.3.0.0/24     | Dynamic       |
| Combine-Functions   |       YES        | 10.3.1.0/24     | Dynamic       |
| Combine-Ingress     |       YES        | 10.3.2.0/25     | Dynamic       |
| Combine-Public      |       YES        | 10.3.2.128/25   | Dynamic       |
| AzureBastionSubnet  |       NO         | 10.3.4.0/23     | 511           |
| Combine-Customer-A  |       NO         | 10.3.101.0/24   | 251           |
| Combine-Customer-B  |       NO         | 10.3.102.0/24   | 251           |
| Combine-Customer-C  |       NO         | 10.3.103.0/24   | 251           |
| Combine-Customer-D  |       NO         | 10.3.104.0/24   | 251           |


You are free to deploy your resources in the `Combine-Customer-*` subnets; the others are used for Combine's internal operations. If your workload cannot be easily deployed inside this scheme, we can alter the subnet configuration as needed.

--------

## Deploying Combine to your Subscription
To deploy Combine to your subscription, we'll need three things:

1. The subscription's quotas for virtual CPU and App Service plan must be increased,
2. A Service Principal with the appropriate permissions must be created, and
3. Any preferences as per the disclaimers above.

### 1. Increase Quota Limit

The vCPU Quota will need to be increased from the default (10) to at least 14; you can do this from within the Azure Portal by following this wiki article: https://docs.microsoft.com/en-us/azure/azure-portal/supportability/regional-quota-requests#request-an-increase-for-regional-vcpu-quotas. We've found that on average it takes only a few minutes for Microsoft to approve the increase for this quota.

Additionally, in order to save on costs we use an [App Service Plan](https://learn.microsoft.com/en-us/azure/app-service/overview-hosting-plans) running on the cheapest tier, the `S1` tier, which you may need to request an increase for. You can do this via the Azure CLI:

```bash
az quota update \
  --scope "/subscriptions/<subscription-id>/providers/Microsoft.Web/locations/<region-id>" \
  --resource-name S1 \
  --limit-object value=10
```

This also generally takes a few minutes unless the region you'd like to deploy in is having capacity issues.

To check on the quota request you can run the following CLI command:

```bash
az quota request list --scope "/subscriptions/<subscription-id>/providers/Microsoft.Web/locations/<region-id>"
```

### 2. Create Service Principal

To provision and manage Combine resources in your subscription, we'll need a Service Principal.

The default role assignment for service principals is `"Owner"`; however, Combine needs to create an identity with the `"Contributor"` role within the subscription, and a Contributor can't create another Contributor in Microsoft's AD hierarchy. The only role that the Service Principal can assume in this case is `"Owner"`.

However, this may not be an option for your company's security posture, so this leaves us with another option - you can opt to create the identity with the required role assignments, and share that identity's information with us. Combine can integrate that identity into it's deployment. This would allow the Service Principal to have only `"Contributor"` permissions on the subscription.

So, there are two paths for assigning permissions to this Service Principal:
1. The Service Principal can be created with `"Owner"` permissions, or
2. The Service Principal can be created with `"Contributor"` permissions, provided that you are able to create a managed identity with a few role assignments, and provide us with that identity's name and resource group name.

In either case, to create the Service Principal, you can use the following command once you're logged in to the target subscription as a Global Administrator:

`az ad sp create-for-rbac --skip-assignment --name <service-principal-name>`

The Service Principal Name can be 'Sequoia-Combine', as an example.

You'll get the following response upon successful creation of the principal:

```json
{
    "appId": "<app-id>",
    "displayName": "<sp-name>",
    "name": "<same-as-app-id>",
    "password": "secret-password-we-need",
    "tenant": "<tenant-id>"
  }
```

We'll need the output from this command, as well as the subscription id.


To give the Service Principal the `"Owner"` role (which is id `8e3af657-a8ff-443c-a75c-2fe8c4bcb635`), we can do the following in the CLI:

`az role assignment create --assignee "<app-id>" --role "8e3af657-a8ff-443c-a75c-2fe8c4bcb635" --scope "subscriptions/<sub-id>"`

Alternatively, to create the Service Principal with the `"Contributor"` role you can use this command:

`az role assignment create --assignee "<app-id>" --role "b24988ac-6180-42a0-ab88-20f7382dd24c" --scope "subscriptions/<sub-id>"`

To make sure the Principal was assigned the correct role, we can list out it's assignments:

`az role assignment list --assignee <app-id>`

We should see one assignment in the response:

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

If you opted to create the Service Principal with `"Contributor"` permissions, you'll want to create the Managed identity with three permissions - `"Contributor"`, `"Log Analtytics Reader"` and `"Storage Account Contributor"`. This is detailed in the Azure documentation [here](https://learn.microsoft.com/en-us/cli/azure/identity?view=azure-cli-latest#az-identity-create) and [here](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-cli#step-4-assign-role). Please remember to create the identity in the same region that Combine will be deployed in. The Service Principal in this case will need read access to the security group inside of which the managed identity resides, i.e. `Microsoft.ManagedIdentity/userAssignedIdentities/read`.

Once you've created the managed identity, please share with us the name of the identity and the resource group that it resides in.

We use Rocky Linux 9, an open-source binary equivalent to Red Hat Linux, for our own compute instances; in order to use them in your subscription you'll need to run this az cli command to "accept" them. They are free, i.e. do not have any cost above the normal Azure operating costs, but require an explicit grant from you only because it is an Azure marketplace image. You can read more on Rocky Linux's Marketplace listing [here](https://azuremarketplace.microsoft.com/en-ca/marketplace/apps/resf.rockylinux-x86_64?tab=Overview).

The command to accept the terms use of Rocky Linux instances is:

```
az vm image terms accept --publisher resf --offer rockylinux-x86_64 --plan 9-lvm
```

If Rocky Linux 9 is not an option for your subscription we are happy to work with you to find another solution.

### 3. Deployment Preferences

The Combine team will need the following choices for your deployment:

- Which Azure region you'd like us to deploy in. Combine can be deploye in any region, but please note that US East is the most stable.
- The source and target regions of your workload. We support Commercial to Government, Commercial to Secret,
 Commercial to Top Secret, Government to Secret and Government to Top Secret.
- Azure Bastion OR Windows + Linux Jumpboxes
- Whether to enable cost savings on Compute instances - it will save some money but startup time for the instances will take a few seconds
- Policy Assignments applied to the subscription OR a particular set of resource group(s)
- The Subnet Schema as presented above OR modified as per your workload's needs
- Which Azure services your workload is likely to use (ACR, AKS, ACA, Function Apps, etc).

Also, please let us know if your organization has any security policies or restrictions that we need to be aware of, i.e. whitelisted IPs or compute instance requirements, etc.

With these three steps, the vCPU Quota, Service Principal, and your desired customizations, we can begin deploying Combine Azure to your subscription! 🚀