---
sidebar_position: 9
title: EKS Add-ons

---

## Combine EKS Addon Rewriter

**Please note that for managed add-ons to work in Combine, you will need to install a small mutating admission webhook which will extend Combine's emulation to inside your cluster.**

This webhook rewrites add-on image URLs to their ISO equivalents. You can find more information and install the webhook [in this directory of our public example repository](https://github.com/Combine-Pathfinder-Palisade/combine-examples/tree/main/combine-eks-rewriter-addon).

## EKS managed add-ons on Combine

Add-on images are delivered by an in-cluster mutating admission webhook that rewrites commercial-partition ECR hosts to their ISO equivalents on pod `CREATE`.

The EKS control plane writes image references directly into the cluster, bypassing Combine's VPC-edge emulation, so this is the one path the edge can't rewrite.

| Add-on | Image version | Status |
|---|---|---|
| vpc-cni | `v1.22.3-eksbuild.1` | ✅ Working — IPAM allocating pod IPs; upgraded in place from v1.21.2 |
| kube-proxy | `v1.35.3-eksbuild.2` | ✅ Working |
| coredns | `v1.13.2-eksbuild.10` | ✅ Working — in-cluster DNS resolving AWS endpoints |
| aws-ebs-csi-driver | `v1.63.0` | ✅ Working — provision, attach, mount verified |
| eks-node-monitoring-agent | `v1.6.6-eksbuild.1` | ✅ Working — reporting node conditions accurately |
| metrics-server | `v0.8.1-eksbuild.11` | ✅ Working — `kubectl top nodes` returning live CPU/memory |
| snapshot-controller | `v8.6.0-eksbuild.2` | Installs and runs |
| aws-ec2-local-instance-store-csi-driver | `v1.0.3` | Installs and runs |
| eks-pod-identity-agent | `v0.1.37` | Installs and runs; credential path not yet exercised |
| aws-guardduty-agent | `v1.15.0` | ⛔ Image delivered, but needs `guardduty-data.<region>` emulated to function |

"Installs and runs" means pods are healthy; the add-on's AWS-backed function
has not been exercised end to end.

### Prerequisites

1. **Node instance role needs `AmazonEC2ContainerRegistryReadOnly`.** Without it
   pulls fail with `no basic auth credentials`.
2. **EBS CSI needs credentials wired.** Either a service account role or the
   driver policy on the node role. IRSA in Combine requires `arn:aws:` (not
   `arn:aws-iso:`) inside the trust policy document.
3. **The EBS CSI add-on ships no StorageClass.** Create one with
   `provisioner: ebs.csi.aws.com`; the default `gp2` class uses the in-tree
   provisioner and won't exercise the driver.
4. **Scope the [registry-rewriting webhook](https://github.com/Combine-Pathfinder-Palisade/combine-examples/tree/main/combine-eks-rewriter-addon) to all namespaces**, excluding only the
   namespace it runs in, rather than listing specific namespaces. AWS deploys
   add-ons to several (`kube-system`, `amazon-guardduty`, `amazon-cloudwatch`), and
   an allowlist silently misses any you didn't enumerate. The rewrite is
   self-limiting — it only touches images matching the AWS add-on ECR pattern — so
   a cluster-wide scope is safe, and `failurePolicy: Ignore` means an outage never
   blocks pod creation.


### Known limitation

Add-ons that call an AWS **data-plane** endpoint at runtime need that endpoint
emulated separately — the webhook only fixes image delivery. GuardDuty is the
worked example: the agent pulls and starts, then fails against
`guardduty-data.<region>`. CloudWatch Observability is expected to behave the same way.
