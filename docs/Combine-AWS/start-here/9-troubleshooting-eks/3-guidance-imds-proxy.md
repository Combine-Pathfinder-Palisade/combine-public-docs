---
sidebar_position: 3
title: Guidance - IMDS Proxy

---

# Combine IMDS Proxy on EKS

:::info[Combine 3.15.2 and later]
This page applies only to Combine 3.15.2 and later. The Combine IMDS Proxy is not available for earlier Combine releases.
:::

An EKS worker Node runs in a commercial host Region, so the EC2 Instance Metadata Service (IMDS) on it reports the host Region, its Availability Zones, and the `aws` Partition. The Node's bootstrap (`nodeadm`), the VPC CNI, add-ons, and your Pods all read those values, so by default they target the host Partition instead of the emulated Partition.

With the [Combine IMDS Proxy](../10-advanced-features/imds-proxy.md) installed on each Node, every process and Pod on the Node reads emulated values from IMDS. With one more `nodeadm` configuration file, the Node's kubelet also joins the Cluster through the Combine Kubernetes Proxy. The Node then bootstraps, joins, and runs against the emulated Partition.

This page covers Amazon Linux 2023 Nodes. For the Combine IMDS Proxy itself (its Configuration, verification, and uninstall), see [Combine IMDS Proxy](../10-advanced-features/imds-proxy.md).

## What Changes on the Node

The examples assume the US Top Secret Partition (C2S) and the default Region mapping (`us-east-1` → `us-iso-east-1`).

| Component | Without the Combine IMDS Proxy | With the Combine IMDS Proxy and the `nodeadm` configuration file |
| --- | --- | --- |
| `nodeadm` (Node bootstrap) | Reads `us-east-1` and calls EC2 in the host Partition | Reads `us-iso-east-1` and calls EC2 through Combine |
| kubelet's connection to the Cluster | The host endpoint (`https://EXAMPLE.gr7.us-east-1.eks.amazonaws.com`), outside Combine | The Combine Kubernetes Proxy (`https://EXAMPLE.gr7.us-iso-east-1.eks.c2s.ic.gov`) |
| The Node's `spec.providerID` | `aws:///us-east-1a/i-...` | `aws:///us-iso-east-1a/i-...`, for Nodes that register after you install the Combine IMDS Proxy |
| VPC CNI (`aws-node`) | Calls EC2 in the host Partition | Calls EC2 through Combine |
| Pods that read IMDS | Host values | Emulated values |
| Calls to the Kubernetes API from inside the Cluster (`kubernetes.default.svc`) | Go directly to the EKS control plane | Unchanged: they go directly to the EKS control plane |
| Node labels such as `topology.kubernetes.io/zone` | Host values | Unchanged: host values, set by the EKS control plane |

## Why kubelet Must Use the Combine Kubernetes Proxy

kubelet authenticates to the Cluster with a token that `nodeadm` configures from the Region that IMDS reports. With the Combine IMDS Proxy, that is the emulated Region, so the token is signed for the emulated STS endpoint (`sts.us-iso-east-1.c2s.ic.gov`):

- **Sent to the host endpoint**, the token is rejected. The EKS control plane validates tokens against the host STS endpoint, so kubelet gets `Unauthorized` and the Node goes `NotReady`.
- **Sent to the Combine Kubernetes Proxy**, the token is re-signed. Combine re-signs it for the host STS endpoint with the Node's IAM Role (see [Resource Role Masquerade](../10-advanced-features/resource-role-masquerade.md)), using the EC2 Instance ID as the session name, just as the EC2 Instance's own credentials do. EKS then authenticates kubelet as `system:node:<Node name>`, exactly as it would without Combine.

The UserData that EKS generates for a managed node group points kubelet at the host endpoint. The `nodeadm` configuration file in [Step 2](#step-2-add-the-combine-imds-proxy-to-the-launch-template) replaces that endpoint with the Combine Kubernetes Proxy endpoint.

:::warning
Do not install the Combine IMDS Proxy on an EKS Node without the `nodeadm` configuration file. The Node keeps working until its next reboot. Then `nodeadm` configures kubelet for the emulated Region against the host endpoint, kubelet gets `Unauthorized`, and the Node does not rejoin the Cluster.
:::

## Requirements

- **Amazon Linux 2023 EKS AMIs**, which bootstrap with `nodeadm`. Amazon Linux 2, Bottlerocket, and Windows Nodes, Fargate, and Karpenter-provisioned Nodes are not covered by this page. Contact the Combine Support Team before you use the Combine IMDS Proxy with them.
- **The Combine Kubernetes Proxy is enabled for the Cluster and the Nodes.** It is enabled by default. If you restrict it (see [Kubernetes Proxy Access Control](../10-advanced-features/kubernetes-proxy-access-control.md)), allow the Nodes' IP addresses and the Node IAM Role.
- **The Combine Endpoint Server can reach the Cluster's API endpoint** on port `443` (see [Security Group](1-guidance.md#security-group)).
- **The Node IAM Role allows Combine to assume it.** If you create the Role through Combine, Combine adds this trust automatically. If you create it outside Combine, add a statement like this to its trust policy, where `Combine-Endpoints` is your Combine Deployment's Endpoint Server Role (`Combine-SHARD_ID-Endpoints` in a sharded Combine Deployment):

    ```json
    {
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::ACCOUNT_NUMBER:role/Combine-Endpoints" },
      "Action": "sts:AssumeRole"
    }
    ```

- **The Node IAM Role has `eks:DescribeCluster`.** The AWS managed policy `AmazonEKSWorkerNodePolicy` includes it.
- **The IMDS hop limit is `2`** on the Nodes, so Pods can reach IMDS (see [AWS EBS CSI Driver](1-guidance.md#aws-ebs-csi-driver)). IMDSv1 and IMDSv2 both work, so the Nodes' `HttpTokens` setting can be `optional` or `required`. With `required`, a request without a token gets `401`, as it would without the Combine IMDS Proxy.
- **The Combine Certificate Authority certificate** (`certificates/ca.cert.pem` from your Credential Package) and **the Combine IMDS Proxy package** for your Combine release (see [Get the Combine IMDS Proxy](../10-advanced-features/imds-proxy.md#get-the-combine-imds-proxy)).

## Step 1: Prepare the Cluster

Make these changes before Nodes with the Combine IMDS Proxy join the Cluster. They are safe on Nodes without it.

### VPC CNI

The VPC CNI (`aws-node`) reads the Region from IMDS, so it calls EC2 through Combine. It verifies TLS with its own certificate bundle, not the Node's, so it rejects Combine's certificate until you give it the Node's bundle. Without this change, `aws-node` fails with `x509: certificate signed by unknown authority` and new Pods get no IP address.

For the `vpc-cni` EKS managed add-on, set these configuration values:

```json
{
  "extraVolumes": [ { "name": "host-ca-bundle", "hostPath": { "path": "/etc/pki/ca-trust/extracted/pem", "type": "Directory" } } ],
  "extraVolumeMounts": [ { "name": "host-ca-bundle", "mountPath": "/host-ca", "readOnly": true } ],
  "extraEnv": [ { "name": "SSL_CERT_FILE", "value": "/host-ca/tls-ca-bundle.pem" } ]
}
```

If you manage `aws-node` yourself, add the same volume, volume mount, and `SSL_CERT_FILE` environment variable to the `aws-node` container of the `aws-node` DaemonSet.

On a Node that has no Combine Certificate Authority installed, the Node's bundle still contains the public Certificate Authorities, so `aws-node` keeps working there.

### AWS EBS CSI Driver

The EBS CSI node plugin (`ebs-csi-node`) runs as a Pod, so it reads the emulated Availability Zone from IMDS. That collides with the host Availability Zone in the Node's `topology.kubernetes.io/zone` label, and the plugin fails to register with `topology value collision`. Have it read the Node's labels instead of IMDS:

- For the `aws-ebs-csi-driver` EKS managed add-on, set the configuration values `{"node":{"metadataSources":"kubernetes"}}`.
- For the Helm chart, set `node.metadataSources=kubernetes`.

### Your Workloads and Other Add-Ons

Any Pod that reads its Region from IMDS now calls the emulated AWS Service Endpoints, so it must trust the Combine Certificate Authority (for example, with `AWS_CA_BUNDLE` for the AWS CLI and Python SDK, or `SSL_CERT_FILE` for Go).

A Pod that sets its Region explicitly ignores IMDS and keeps calling that Region:

- **IRSA.** For every Pod whose ServiceAccount has the `eks.amazonaws.com/role-arn` annotation, EKS injects `AWS_REGION` and `AWS_DEFAULT_REGION` set to the commercial host Region. To send such a Pod's AWS API calls through Combine, set `AWS_REGION` and `AWS_DEFAULT_REGION` to the emulated Region in the Pod spec. EKS does not replace a value that the Pod spec sets.
- **The `aws-ebs-csi-driver` managed add-on** sets `AWS_REGION` to the host Region on its controller. Leave it that way: the controller creates each EBS Volume in the Availability Zone from the Node's `topology.kubernetes.io/zone` label, which holds the host Availability Zone.

## Step 2: Add the Combine IMDS Proxy to the Launch Template

For an EKS managed node group that uses an EKS AMI, add this part to the UserData of the node group's launch template. EKS adds its own `nodeadm` configuration to the UserData. Set:

- `CLUSTER_NAME` to the Cluster name.
- `PACKAGE_URL` to a location the Node can download the Combine IMDS Proxy package from, for example a presigned S3 URL or an internal web server.
- The certificate block to the contents of your `ca.cert.pem`.
- The Combine IMDS Proxy Configuration to match your Combine Deployment (see [Create the Configuration](../10-advanced-features/imds-proxy.md#create-the-configuration)).

```text
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="BOUNDARY"

--BOUNDARY
Content-Type: text/x-shellscript; charset="us-ascii"

#!/bin/bash
set -euo pipefail
exec > >(tee -a /var/log/combine-imds-proxy-userdata.log) 2>&1

CLUSTER_NAME='my-cluster'
PACKAGE_URL='https://...'

# 1. Trust the Combine Certificate Authority.
cat > /etc/pki/ca-trust/source/anchors/combine-ca.pem <<'EOF'
-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----
EOF
update-ca-trust extract

# 2. Install and start the Combine IMDS Proxy.
WORK=$(mktemp -d)
curl -fsSL "$PACKAGE_URL" | tar -xz -C "$WORK"
cat > "$WORK/imds-proxy.conf" <<'EOF'
COMBINE_IMDS_PARTITION=aws-iso
COMBINE_IMDS_DOMAIN=c2s.ic.gov
COMBINE_IMDS_MAP_REGION=us-east-1=us-iso-east-1
COMBINE_IMDS_MAP_AZ_ID=use1=usie1
EOF
(cd "$WORK"/combine-imds-proxy-*/ && ./install.sh --config "$WORK/imds-proxy.conf" --now)

# 3. Point kubelet at the Combine Kubernetes Proxy.
export AWS_CA_BUNDLE=/etc/pki/tls/certs/ca-bundle.crt
TOKEN=$(curl -s -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 60')
REGION=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region)
read -r ENDPOINT CA_DATA < <(aws eks describe-cluster --name "$CLUSTER_NAME" --query 'cluster.[endpoint,certificateAuthority.data]' --output text)
if [[ "$ENDPOINT" != *".$REGION.eks."* ]]; then
  echo "Combine: DescribeCluster returned [$ENDPOINT], not a Combine Kubernetes Proxy endpoint for [$REGION]" >&2
  exit 1
fi
install -d -m 0755 /etc/eks/nodeadm.d
cat > /etc/eks/nodeadm.d/10-combine-kubernetes-proxy.yaml <<EOF
apiVersion: node.eks.aws/v1alpha1
kind: NodeConfig
spec:
  cluster:
    apiServerEndpoint: $ENDPOINT
    certificateAuthority: $CA_DATA
EOF
echo "Combine: kubelet will use $ENDPOINT"

--BOUNDARY--
```

On the Node's first boot:

1. `nodeadm` reads its configuration with host values, before UserData runs. Nothing starts from this pass.
2. The UserData installs the Combine IMDS Proxy, then calls `DescribeCluster` through Combine. Combine returns the Combine Kubernetes Proxy endpoint and a Certificate Authority bundle that holds both the Cluster's and Combine's Certificate Authorities. The script writes them to `/etc/eks/nodeadm.d/10-combine-kubernetes-proxy.yaml`.
3. `nodeadm` runs again after UserData. It merges that file over the EKS configuration, reads emulated values from IMDS, and starts kubelet against the Combine Kubernetes Proxy.

On every later boot, the Combine IMDS Proxy starts before `nodeadm`, and the file is still in place, so the Node rejoins the same way.

The script stops with an error if `DescribeCluster` does not return a Combine Kubernetes Proxy endpoint, for example because the Combine Kubernetes Proxy is disabled for the Cluster. The output is in `/var/log/combine-imds-proxy-userdata.log`.

## Custom AMIs and Self-Managed Nodes

If you build your own AMI or run self-managed Nodes, you supply the complete `nodeadm` configuration in the UserData yourself:

- Bake the Combine Certificate Authority and the Combine IMDS Proxy into the AMI (see [Bake into an AMI](../10-advanced-features/imds-proxy.md#bake-into-an-ami)). `nodeadm` then reads emulated values from the first boot.
- Set `apiServerEndpoint` and `certificateAuthority` in the `NodeConfig` to the `endpoint` and `certificateAuthority.data` that `aws eks describe-cluster` returns when you call it through Combine. You do not need the `/etc/eks/nodeadm.d/` file.

## Verify

1. Check that the Node is `Ready` and has an emulated provider ID:

    ```bash
    kubectl get nodes -o custom-columns='NAME:.metadata.name,STATUS:.status.conditions[?(@.type=="Ready")].status,PROVIDER:.spec.providerID'
    ```

2. On the Node, check that kubelet uses the Combine Kubernetes Proxy and holds connections to the Combine Endpoint Server:

    ```bash
    sudo grep server: /var/lib/kubelet/kubeconfig     # https://EXAMPLE.gr7.us-iso-east-1.eks.c2s.ic.gov
    sudo ss -tnp | grep kubelet                       # connections to the Combine Endpoint Server on port 443
    ```

3. Check the values a Pod reads from IMDS (see [Verify](../10-advanced-features/imds-proxy.md#verify) for the `imds` helper):

    ```bash
    kubectl run imds-check --rm -it --restart=Never --image=IMAGE -- sh -c 'TOKEN=$(curl -s -X PUT http://169.254.169.254/latest/api/token -H "X-aws-ec2-metadata-token-ttl-seconds: 60"); curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region; echo'
    ```

4. In the Combine Log (see [View Combine Logs](../../tutorials/operations/how-to-view-combine-logs.md)), kubelet's requests appear with the API `Kubernetes`, and their Role ARN is the Node IAM Role.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| The Node goes `NotReady` after a reboot, and `journalctl -u kubelet` shows `Unauthorized` | kubelet uses the host endpoint. The `nodeadm` configuration file is missing, or holds the host endpoint. Check `/etc/eks/nodeadm.d/` and the `server:` line in `/var/lib/kubelet/kubeconfig`. |
| kubelet gets `Forbidden`, or the Node never registers, and the Combine Log shows the Default Role for kubelet's requests | Combine could not assume the Node IAM Role. Check its trust policy (see [Requirements](#requirements)) and look for a **Could Not Assume Role** Alert Event. |
| kubelet reports `x509: certificate signed by unknown authority` | The `certificateAuthority` in the `nodeadm` configuration does not include the Combine Certificate Authority. Call `DescribeCluster` through Combine to get it. |
| The UserData stops at `aws eks describe-cluster` | The Node IAM Role lacks `eks:DescribeCluster`, the Combine Certificate Authority is not installed, or the Combine Kubernetes Proxy is disabled for the Cluster or the Node. |
| New Pods stay in `ContainerCreating`, and `/var/log/aws-routed-eni/ipamd.log` shows `x509` errors | `aws-node` does not trust the Combine Certificate Authority (see [VPC CNI](#vpc-cni)). |
| `ebs-csi-node` does not start and logs `topology value collision` | The EBS CSI node plugin reads IMDS (see [AWS EBS CSI Driver](#aws-ebs-csi-driver)). |
| A Pod fails with `x509` errors when it calls AWS | The Pod does not trust the Combine Certificate Authority (see [Your Workloads and Other Add-Ons](#your-workloads-and-other-add-ons)). |

## Known Limitations

- **Calls from inside the Cluster bypass Combine.** Controllers, add-ons, and Pods that call the Kubernetes API through `kubernetes.default.svc` reach the EKS control plane directly. They see host values in Node labels, and the Combine Kubernetes Proxy does not rewrite their requests.
- **Pods that use the Node IAM Role's credentials are signed with the Default Role.** Combine matches a caller to an EC2 Instance by the EC2 Instance's primary private IP address, and a Pod's IP address is a secondary private IP address. kubelet and host-network Pods use the primary private IP address, so Combine signs their calls with the Node IAM Role. To give a Pod its own IAM Role, use IRSA.
- **Existing Nodes keep their provider ID.** `spec.providerID` cannot change after a Node registers, so Nodes that registered before you installed the Combine IMDS Proxy keep host Availability Zones in it. Replace them so that every Node registers again. This matters for the Cluster Autoscaler, which works with Nodes that run the Combine IMDS Proxy and Combine's default rewrite, but not with a mix of the two kinds of Node (see [Nodes That Run the Combine IMDS Proxy](1-guidance.md#nodes-that-run-the-combine-imds-proxy)).
- **The Combine Endpoint Server carries kubelet traffic.** Each Node's kubelet holds several long-lived connections to the Combine Endpoint Server and renews its Node lease through it every 10 seconds. Plan Endpoint Server capacity for the number of Nodes.
