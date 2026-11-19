---
sidebar_position: 1
title: Guidance

---

# Combine EKS Support

Combine supports AWS EKS Clusters in an emulated Region. This page covers the settings that every Cluster needs. Two more pages cover the rest:

- **[IMDS on EKS](3-guidance-imds.md)** covers how your Nodes join the Cluster and which AWS Service Endpoints they call, with or without the Combine IMDS Proxy. It also covers the Combine Firewall exemptions for EKS and the Cluster Autoscaler. Read it before you add Nodes.
- **[Combine EKS Add-Ons](2-guidance-add-ons.md)** covers EKS managed add-ons.

For a complete working example of an EKS Cluster in Combine, see the [Combine EKS example repository](https://github.com/Combine-Pathfinder-Palisade/combine-examples/tree/main/combine-eks-example). To run Combine itself on an EKS Cluster, see [Configure Combine on EKS](../../tutorials/operations/how-to-configure-combine-on-eks.md).

## Kubernetes Version

Combine enforces which Kubernetes versions each emulated Partition supports. Combine rejects a `CreateCluster` or `UpdateClusterVersion` request with an unsupported `version` with an `InvalidParameterException` (`unsupported Kubernetes version <version>`) and raises an Alert Event. If a `CreateCluster` request does not specify a `version`, Combine sets it to the emulated Partition's default version.

As of Combine 3.14.7:

| Emulated Partition | Partition ID | Supported Versions | Default Version |
|---|---|---|---|
| US Top Secret Partition (C2S) | `aws-iso` | 1.31, 1.32, 1.33, 1.34, 1.35, 1.36 | 1.36 |
| US Secret Partition (SC2S) | `aws-iso-b` | 1.31, 1.32, 1.33, 1.34, 1.35, 1.36 | 1.36 |
| US GovCloud | `aws-us-gov` | 1.32, 1.33, 1.34, 1.35 | 1.35 |
| EUSC | `aws-eusc` | 1.33, 1.34, 1.35 | 1.35 |

## `kubectl` Version

Combine proxies the `kubectl` streaming commands (`exec`, `cp`, `attach`, and `port-forward`) only over WebSockets. Use `kubectl` 1.31 or later, which sends all of them over WebSockets by default.

Older versions of `kubectl` use SPDY instead: `kubectl` 1.29 and earlier for every streaming command, and `kubectl` 1.30 for `port-forward`. In Combine 3.15.2 and later, Combine refuses a SPDY request at once:

```
error: unable to upgrade connection: Combine supports Kubernetes streaming only over WebSockets. [Upgrade: SPDY/3.1] is not supported. Use [kubectl] 1.31 or later.
```

Earlier versions of Combine wait about 65 seconds before the command fails. Do not set `KUBECTL_REMOTE_COMMAND_WEBSOCKETS=false` or `KUBECTL_PORT_FORWARD_WEBSOCKETS=false`, which switch `kubectl` back to SPDY.

## Combine and OIDC

Combine supports EKS OIDC integration without rewriting calls to the OIDC provider. The commercial URL that AWS provides works as-is.

You typically create the IAM Roles with the `WLDEVELOPER` role. On the high side, the government customer creates the OIDC provider itself. In Combine, you can act as the government customer with the `WLCUSTOMER-IT` role (or an equivalent role outside Combine).

`WLCUSTOMER-IT` grants permissions that are normally reserved for U.S. Government customers, so that you can make those requests yourself. It operates outside the Combine emulation boundary.

_NOTE: Use `WLCUSTOMER-IT` only to simulate actions reserved for the government customer. It is not intended for development._

## Security Group

The Combine Kubernetes Proxy carries `kubectl` traffic to your Cluster's API endpoint, and kubelet traffic too if your Nodes run the Combine IMDS Proxy. So the Combine Endpoint Server must be able to reach the Cluster's API endpoint on port `443`.

If your Cluster is open to all traffic within the VPC, no change is needed. Otherwise, add a rule to the Cluster's Security Group that allows the Combine Endpoint Server Security Group. The Endpoint Server Security Group is named `<VpcName>-SG-Endpoints`, which is `Combine-SG-Endpoints` by default.

![EKS Cluster Security Group](/aws/eks-cluster-sg.png)

In the screenshot, the **Source** of the first rule references the Cluster's Security Group itself. Add a rule like the second one, which references the Endpoint Server Security Group.

## Nodes and the Cluster Autoscaler

How Nodes join the Cluster, the Combine Firewall exemptions for EKS, and the Cluster Autoscaler's Availability Zone exemption all depend on whether your Nodes run the Combine IMDS Proxy. See [IMDS on EKS](3-guidance-imds.md).

## AWS EBS CSI Driver

Use version 1.33 or later of the [AWS EBS CSI Driver](https://github.com/kubernetes-sigs/aws-ebs-csi-driver). Newer versions, such as 1.53, work too. Then:

- On the worker Nodes, enable IMDS and set the HTTP PUT response hop limit to `2` or more.
- Give the CSI controller credentials through the Node IAM Role (from IMDS) or through IRSA.

With this configuration, you can provision dynamic EBS-backed PersistentVolumes in emulated EKS Clusters. If your Nodes run the Combine IMDS Proxy, also set the node plugin's metadata source (see [AWS EBS CSI Driver](3-guidance-imds.md#aws-ebs-csi-driver) in IMDS on EKS).

### PersistentVolumeClaims Stuck in `Pending`

If PersistentVolumeClaims (PVCs) stay in `Pending`, Pods most likely cannot reach the EC2 Instance Metadata Service (IMDS), so the EBS CSI Driver cannot get credentials. You may see:

- PVCs in `Pending` with messages like `Waiting for first consumer` or `ExternalProvisioning`
- Errors such as `GetInstanceIdentityDocument` timing out, `failed to refresh cached credentials`, or `no EC2 IMDS role found`

The cause is almost always an IMDS HTTP PUT response hop limit of `1`, not an emulation limitation. The hop limit is part of an EC2 Instance's metadata options, and it controls how many network hops a response from IMDS can take. A Pod needs a hop limit of at least `2`, because the response takes one more hop to reach the Pod's own network namespace. For more information, see [ModifyInstanceMetadataOptions](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_ModifyInstanceMetadataOptions.html#API_ModifyInstanceMetadataOptions_RequestParameters) in the Amazon EC2 API Reference.

Set the hop limit to `2` on the worker Nodes. Pods can then reach IMDS and get credentials, and the PVCs bind.

## Additional Considerations

- Provision your EKS Clusters with Infrastructure as Code (IaC). Clusters built by hand in the AWS Console ("ClickOps") are hard to reproduce reliably, and the AWS Console offers options in the AWS Commercial and AWS GovCloud Partitions that the emulated Regions do not have.
- Combine does not fully support EKS Clusters provisioned with the [TerraForm AWS EKS module version 21.3.1](https://registry.terraform.io/modules/terraform-aws-modules/eks/aws/21.3.1). We anticipate supporting it soon.
- Some Helm charts for plugins hard-code AWS Commercial ARNs, Regions, or Availability Zones. You may need to change them.
- Your Combine Deployment must have Permissions Boundaries and IAM Self Service enabled. If you are not sure whether they are enabled on your account, [email the Combine Support Team](mailto:service-request@sequoiainc.com).
- Prefix every IAM Role that does EKS-related work (node groups, Pods, Clusters) with `PROJECT_`, as the customer's high side requires. Combine does not let you create Roles that do not follow this format.
