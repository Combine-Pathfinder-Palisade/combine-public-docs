---
sidebar_position: 2
title: Guidance - Add Ons

---

# Combine EKS Add-Ons

For EKS managed add-ons to work in Combine, you must install a small mutating admission webhook that extends Combine's emulation to inside your cluster. This page describes the webhook, the prerequisites, and which add-ons work with it. For general EKS guidance, see [Combine EKS Support](1-guidance.md).

## Combine EKS Add-On Rewriter

The EKS control plane writes image references directly into the cluster, bypassing Combine's VPC-edge emulation, so this is the one path the edge can't rewrite. The Combine EKS Add-On Rewriter webhook runs in the cluster and delivers add-on images: on Pod `CREATE`, it rewrites commercial-partition ECR hosts in add-on image URLs to their ISO equivalents.

To learn more and install the webhook, see the [combine-eks-rewriter-addon directory](https://github.com/Combine-Pathfinder-Palisade/combine-examples/tree/main/combine-eks-rewriter-addon) of the public Combine examples repository.

## Prerequisites

1. **The Node instance role needs `AmazonEC2ContainerRegistryReadOnly`.** Without it, image pulls fail with `no basic auth credentials`.
2. **The EBS CSI Driver needs credentials.** Use either a ServiceAccount role or the driver policy on the Node role. IRSA in Combine requires `arn:aws:` (not `arn:aws-iso:`) inside the trust policy document.
3. **The EBS CSI add-on ships no StorageClass.** Create one with `provisioner: ebs.csi.aws.com`. The default `gp2` class uses the in-tree provisioner and won't exercise the driver.
4. **Scope the [registry-rewriting webhook](https://github.com/Combine-Pathfinder-Palisade/combine-examples/tree/main/combine-eks-rewriter-addon) to all namespaces**, excluding only the namespace it runs in, rather than listing specific namespaces. AWS deploys add-ons to several namespaces (`kube-system`, `amazon-guardduty`, `amazon-cloudwatch`), and an allowlist silently misses any you didn't enumerate. The rewrite is self-limiting: it only touches images that match the AWS add-on ECR pattern, so a cluster-wide scope is safe. With `failurePolicy: Ignore`, a webhook outage never blocks Pod creation.

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

## Known Limitation

Add-ons that call an AWS data-plane endpoint at runtime need that endpoint emulated separately. The webhook only fixes image delivery. GuardDuty is the worked example: the agent pulls and starts, then fails against `guardduty-data.<region>`. CloudWatch Observability is expected to behave the same way.
