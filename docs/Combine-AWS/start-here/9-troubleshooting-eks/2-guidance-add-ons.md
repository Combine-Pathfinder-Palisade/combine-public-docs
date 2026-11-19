---
sidebar_position: 2
title: Guidance - Add Ons

---

# Combine EKS Add-Ons

This page covers how your Nodes get the container images for EKS managed add-ons, what the add-ons need, and which add-ons work in Combine. For general EKS guidance, see [Combine EKS Support](1-guidance.md).

## Image Delivery

The EKS control plane writes each managed add-on's image references directly into the Cluster, a path that never passes through Combine. The references point at ECR in the host Region, for example:

```text
602401143452.dkr.ecr.us-east-1.amazonaws.com/eks/coredns:v1.13.2-eksbuild.10
```

Your Nodes pull these images in one of two ways.

### Without the Combine EKS Add-On Rewriter

Nodes pull add-on images from ECR in the host Region, outside Combine, through the Combine Firewall exemptions for EKS. This needs no extra setup, as long as:

- The `EnableAirgapAccessEKS` CloudFormation Parameter on the Combine VPC Stack is `true` (the default), and `EnableAirgapAccessEKSForCidrBlocks`, if you set it, includes your Nodes' subnets (see [Required Settings](3-guidance-imds.md#required-settings) in IMDS on EKS).
- The add-on's images are in ECR in the Combine VPC's own Region. The exemptions do not cover ECR in other Regions.

### With the Combine EKS Add-On Rewriter

The [Combine EKS Add-On Rewriter](https://github.com/Combine-Pathfinder-Palisade/combine-examples/tree/main/combine-eks-rewriter-addon) is a small mutating admission webhook that runs in the Cluster. When a Pod is created, it rewrites the add-on image references to the emulated ECR registry, so that Nodes pull the images through Combine like any other image:

```text
602401143452.dkr.ecr.us-iso-east-1.c2s.ic.gov/eks/coredns:v1.13.2-eksbuild.10
```

Use it if the Combine Firewall exemptions for EKS are off or do not include your Nodes, or if you want add-on image pulls to go through Combine too. It needs:

- **Nodes that trust the Combine Certificate Authority**, because the ECR credential provider and containerd connect to Combine. Nodes that run the Combine IMDS Proxy already do (see [Step 2](3-guidance-imds.md#step-2-add-the-combine-imds-proxy-to-the-launch-template) in IMDS on EKS). Other Nodes need it in their trust store, for example from UserData.
- **A cluster-wide scope.** Scope the webhook to all namespaces, excluding only the namespace it runs in, rather than listing specific namespaces. AWS deploys add-ons to several namespaces (`kube-system`, `amazon-guardduty`, `amazon-cloudwatch`), and a list silently misses any you did not include. The webhook only touches images that match the AWS add-on ECR pattern, so a cluster-wide scope is safe. With `failurePolicy: Ignore`, a webhook outage never blocks Pod creation.

To install it, see the [combine-eks-rewriter-addon directory](https://github.com/Combine-Pathfinder-Palisade/combine-examples/tree/main/combine-eks-rewriter-addon) of the public Combine examples repository.

### Images Outside ECR

Add-ons and Helm charts that pull from registries outside ECR (such as `registry.k8s.io` or `quay.io`) are blocked by the Combine Firewall either way, and the Combine EKS Add-On Rewriter does not rewrite them. Copy those images into ECR.

## Prerequisites

1. **The Node IAM Role needs `AmazonEC2ContainerRegistryReadOnly`.** Without it, image pulls fail with `no basic auth credentials`.
2. **The EBS CSI Driver needs credentials.** Use either a ServiceAccount role or the driver policy on the Node IAM Role. IRSA in Combine requires `arn:aws:` (not `arn:aws-iso:`) inside the trust policy document.
3. **The EBS CSI add-on ships no StorageClass.** Create one with `provisioner: ebs.csi.aws.com`. The default `gp2` class uses the in-tree provisioner and does not exercise the driver.

## With the Combine IMDS Proxy

On Nodes that run the Combine IMDS Proxy, two add-ons need extra configuration values (see [Step 1: Prepare the Cluster](3-guidance-imds.md#step-1-prepare-the-cluster) in IMDS on EKS):

- **`vpc-cni`**: mount the Node's certificate bundle and set `SSL_CERT_FILE`, because `aws-node` then calls EC2 through Combine.
- **`aws-ebs-csi-driver`**: set `node.metadataSources` to `kubernetes`, because the node plugin otherwise reads the emulated Availability Zone from IMDS.

## Add-On Status

| Add-On | Image Version | Status | Notes |
|---|---|---|---|
| vpc-cni | `v1.22.3-eksbuild.1` | Working | IPAM allocating Pod IPs; upgraded in place from v1.21.2 |
| kube-proxy | `v1.35.3-eksbuild.2` | Working | |
| coredns | `v1.13.2-eksbuild.10` | Working | In-cluster DNS resolving AWS endpoints |
| aws-ebs-csi-driver | `v1.63.0` | Working | Provision, attach, and mount verified |
| eks-node-monitoring-agent | `v1.6.6-eksbuild.1` | Working | Reporting Node conditions accurately |
| metrics-server | `v0.8.1-eksbuild.11` | Working | `kubectl top nodes` returning live CPU/memory |
| snapshot-controller | `v8.6.0-eksbuild.2` | Installs and runs | |
| aws-ec2-local-instance-store-csi-driver | `v1.0.3` | Installs and runs | |
| eks-pod-identity-agent | `v0.1.37` | Installs and runs | Credential path not yet exercised |
| aws-guardduty-agent | `v1.15.0` | Not functional | Image delivered, but needs `guardduty-data.<region>` emulated to function |

"Installs and runs" means the add-on's Pods are healthy, but its AWS-backed function has not been exercised end to end.

These results are from Nodes without the Combine IMDS Proxy. On Nodes that run it, `vpc-cni`, `kube-proxy`, `coredns`, and `aws-ebs-csi-driver` work with the settings in [With the Combine IMDS Proxy](#with-the-combine-imds-proxy). The other add-ons have not been tested there.

## Known Limitation

Add-ons that call an AWS data-plane endpoint at runtime need that endpoint emulated separately. The Combine EKS Add-On Rewriter only delivers images. GuardDuty is the worked example: the agent pulls and starts, then fails against `guardduty-data.<region>`. CloudWatch Observability is expected to behave the same way.
