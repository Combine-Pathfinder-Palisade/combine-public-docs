---
sidebar_position: 3
title: Guidance - IMDS

---

# IMDS on EKS

An EKS worker Node runs in a commercial host Region, so the EC2 Instance Metadata Service (IMDS) on it reports the host Region, its Availability Zones, and the `aws` Partition. The Node's bootstrap (`nodeadm`), the VPC CNI, add-ons, and your Pods all read those values. Whether your Nodes run the Combine IMDS Proxy decides how they join the Cluster, which AWS Service Endpoints they call, and what you must configure:

- **[Without the Combine IMDS Proxy](#without-the-combine-imds-proxy)** (every Combine release). Nodes read host values and join the Cluster directly. Their AWS API Calls go to the host Region through Combine Firewall exemptions.
- **[With the Combine IMDS Proxy](#with-the-combine-imds-proxy)** (Combine 3.15.2 and later). Nodes read emulated values and join the Cluster through the Combine Kubernetes Proxy. Their AWS API Calls go through Combine.

The examples on this page assume the US Top Secret Partition (C2S) and the default Region mapping (`us-east-1` → `us-iso-east-1`).

| | Without the Combine IMDS Proxy | With the Combine IMDS Proxy |
| --- | --- | --- |
| Combine releases | All | 3.15.2 and later |
| What IMDS reports to every process and Pod on the Node | Host values (`us-east-1`, `aws`) | Emulated values (`us-iso-east-1`, `aws-iso`) |
| `nodeadm` and the VPC CNI (`aws-node`) | Call EC2 in the host Region, through the Combine Firewall exemptions | Call EC2 through Combine |
| kubelet's connection to the Cluster | The Cluster's own endpoint (`https://EXAMPLE.gr7.us-east-1.eks.amazonaws.com`) | The Combine Kubernetes Proxy (`https://EXAMPLE.gr7.us-iso-east-1.eks.c2s.ic.gov`) |
| The Node's `spec.providerID` | `aws:///us-east-1a/i-...` | `aws:///us-iso-east-1a/i-...` |
| Pods that take their Region from IMDS | Call the host Region, outside Combine | Call the emulated Region, through Combine |
| Cluster Autoscaler | Needs an exemption from Combine's Availability Zone rewrite | Works with Combine's default rewrite |
| What you set up | The Combine Firewall exemptions (on by default), the Region in your Pod specs, and the Cluster Autoscaler exemption | Cluster add-on settings and the Node UserData |

Either way, calls to the Kubernetes API from inside the Cluster (`kubernetes.default.svc`) go directly to the EKS control plane, and Node labels such as `topology.kubernetes.io/zone` hold host values. Both also need the Cluster settings in [Combine EKS Support](1-guidance.md): the [Security Group](1-guidance.md#security-group) rule for the Combine Endpoint Server, and an IMDS hop limit of `2` (see [AWS EBS CSI Driver](1-guidance.md#aws-ebs-csi-driver)).

For what happens on a Node step by step, see [Appendix: Under the Hood](#appendix-under-the-hood).

## Without the Combine IMDS Proxy

This is how EKS Nodes work in Combine unless you install the Combine IMDS Proxy, in every Combine release.

The UserData that EKS generates for a managed node group points kubelet at the Cluster's own API endpoint, so kubelet connects to the Cluster without going through Combine. The Node reads host values from IMDS, calls EC2 in the host Region, and pulls the EKS system images (VPC CNI, kube-proxy, and so on) from ECR in the host Region.

### Required Settings

- **Keep the Combine Firewall exemptions for EKS.** Leave the `EnableAirgapAccessEKS` CloudFormation Parameter on the Combine VPC Stack (the `combine-vpc.yaml` template) set to `true` (the default). It allows these endpoints in the host Region through the Combine Firewall: the EC2, ECR, STS, and Elastic Load Balancing APIs; ECR registries, and the S3 bucket that ECR serves image layers from; EKS Cluster API endpoints and the EKS OIDC issuer; and the Amazon Linux 2023 package repository. To allow them only from your Nodes' subnets, set the `EnableAirgapAccessEKSForCidrBlocks` CloudFormation Parameter to those subnets' CIDR blocks. The VPC CNI sends Pod traffic that leaves the VPC from the Node's address by default, so Pods on those Nodes can still use the exemptions. (See [Reference - clients.json](../../tutorials/operations-self-service-deployment/reference-clients-json.md).)
- **Enable private endpoint access on the Cluster.** The Cluster's API endpoint then resolves to addresses inside your VPC, so kubelet's connection stays inside the VPC. Without it, kubelet reaches the public endpoint through the Combine Firewall exemptions.
- **Point your Pods at the emulated Region.** A Pod that takes its Region from IMDS gets the host Region and calls the host AWS Service Endpoints directly. The Combine Firewall blocks most of those calls, and the calls that an exemption allows (for example, to EC2 or STS) bypass Combine. Set `AWS_REGION` and `AWS_DEFAULT_REGION` to the emulated Region in the Pod spec, and give the Pod the Combine Certificate Authority (for example, with `AWS_CA_BUNDLE` for the AWS CLI and Python SDK, or `SSL_CERT_FILE` for Go). This applies to IRSA Pods too: EKS injects the host Region into them, but does not replace a value that the Pod spec sets. Combine signs the calls of a Pod without its own IAM Role with the Default Role (see [Known Limitations](#known-limitations)).
- **Exempt the Cluster Autoscaler**, if you use it (see [Cluster Autoscaler](#cluster-autoscaler-without-the-combine-imds-proxy)).

The VPC CNI and the AWS EBS CSI Driver need no change. They read host values from IMDS, call EC2 in the host Region through the exemptions, and use the same host Availability Zones as the Node labels.

In Combine releases before 3.15.2, a workload that needs emulated values from IMDS can use the Combine EC2 IMDS Proxy service, which also runs as a Pod in an EKS Cluster (see [IMDS](../6-known-issues.md#imds) in Known Issues).

### Cluster Autoscaler {#cluster-autoscaler-without-the-combine-imds-proxy}

The Cluster Autoscaler matches each Node to an Auto Scaling Group instance by comparing two provider IDs as strings:

- **The Node's `spec.providerID`**, which the autoscaler reads from the Kubernetes API (`kubernetes.default.svc`), outside Combine. A Node without the Combine IMDS Proxy registers with the commercial Availability Zone from IMDS: `aws:///us-east-1c/i-0502afe1f135ab04c`.
- **A provider ID that the autoscaler builds** from `DescribeAutoScalingGroups`, which it calls through Combine. Combine rewrites the instance's Availability Zone to ISO form, so the autoscaler builds `aws:///us-iso-east-1c/i-0502afe1f135ab04c`.

The two never match. The autoscaler reports every Node as unregistered (`node is not present in aws: could not find instance`) and cannot scale its node groups down. These two commands show the mismatch:

```bash
kubectl get nodes -o custom-columns='NAME:.metadata.name,PROVIDER:.spec.providerID'
# ip-10-0-36-249.ec2.internal   aws:///us-east-1c/i-0502afe1f135ab04c

aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names <asg> --query 'AutoScalingGroups[].Instances[].[InstanceId,AvailabilityZone]' --output text
# i-0502afe1f135ab04c   us-iso-east-1c
```

To fix the mismatch, exempt the autoscaler from the Availability Zone rewrite. Its `DescribeAutoScalingGroups` responses then keep the commercial Availability Zones and match the Nodes. Set these two Configuration Values (see [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md)):

```text
combine.endpoints.aws.rewriter.response.autoscaling.availabilityZone.enable.roleArn.contains.except=cluster-autoscaler
combine.endpoints.aws.rewriter.response.autoscaling.availabilityZone.enable.userAgents.except=cluster-autoscaler
```

Each is a space-separated list of case-sensitive substrings. A request skips the rewrite if either one matches:

- `...roleArn.contains.except` matches the caller's assumed-role ARN, for example `arn:aws:sts::<account>:assumed-role/PROJECT_cluster-autoscaler/...`.
- `...userAgents.except` matches the `user-agent` header, for example `aws-sdk-go-v2/... cluster-autoscaler/1.35.0 ...`.

The autoscaler's requests match both, so setting both is redundant but safe. Every other client keeps receiving ISO Availability Zones. These are not the request-side `combine.endpoints.aws.rewriter.request.strictMode.userAgents.except`, which controls only strict-mode validation and does not affect response Availability Zones.

Run the autoscaler against the emulated Region, through Combine. The Combine Firewall has no exemption for Auto Scaling in the host Region. If the autoscaler uses IRSA, EKS injects `AWS_REGION` set to the host Region into its Pod, so set the emulated Region with the Helm chart's `awsRegion` value (or the `AWS_REGION` environment variable), and give the autoscaler the Combine Certificate Authority.

Do not set the exemption if any Node in the autoscaler's node groups runs the Combine IMDS Proxy (see [Cluster Autoscaler](#cluster-autoscaler) under With the Combine IMDS Proxy).

#### Verify the Exemption

Do not verify with your own `aws autoscaling` call. Your identity is not exempt, so it keeps returning `us-iso-east-1c`. Check the autoscaler's own requests instead.

1. The autoscaler calls `DescribeAutoScalingGroups` about every 10 seconds. To force a call, restart it:

    ```bash
    kubectl rollout restart deployment/cluster-autoscaler -n kube-system
    ```

2. In the Combine Log (see [View Combine Logs](../../tutorials/operations/how-to-view-combine-logs.md)), find a transaction whose **user-agent** contains `cluster-autoscaler/`, whose **roleArn** contains `assumed-role/PROJECT_cluster-autoscaler/`, and whose **parameters** show `Action=DescribeAutoScalingGroups` with the `k8s.io/cluster-autoscaler/enabled` tag filter.
3. Check that the exemption applied:
    - `ApiResponseRewriterAutoscalingAvailabilityZone` is missing from the transaction's `Response Rewriting : Body : Applying Rewriter [...]` lines. `ApiResponseRewriterAutoscalingArn` still appears, because it is a separate Rewriter.
    - The `response` section (what Combine returned) shows commercial Availability Zones (`us-east-1c`), the same as the `responseProxy` section (what AWS returned).
4. Check the `cluster-autoscaler-status` ConfigMap in the `kube-system` namespace. Each node group should report its Nodes under `registered`, with `unregistered: 0`.

If the Rewriter still appears and `response` still shows `us-iso-east-1c`, the Configuration Values have not reached Combine. Check their names, and that they are set in the Combine Configuration table.

### Troubleshooting {#troubleshooting-without-the-combine-imds-proxy}

| Symptom | Likely cause |
| --- | --- |
| `journalctl -u kubelet` shows connection timeouts to the Cluster's API endpoint | Private endpoint access is off and the Combine Firewall blocks the public endpoint. Check `EnableAirgapAccessEKS`, and that `EnableAirgapAccessEKSForCidrBlocks` (if set) includes the Node's subnet. |
| EKS system Pods fail with `ErrImagePull` | The Node cannot reach ECR in the host Region. Check `EnableAirgapAccessEKS` and `EnableAirgapAccessEKSForCidrBlocks`, or pull the images through Combine (see [Image Delivery](2-guidance-add-ons.md#image-delivery)). |
| A Pod's AWS API Calls time out | The Pod takes the host Region from IMDS, and the Combine Firewall blocks the call. Set the emulated Region in the Pod spec (see [Required Settings](#required-settings)). |
| The Cluster Autoscaler logs `node is not present in aws: could not find instance` | The autoscaler is not exempt from the Availability Zone rewrite (see [Cluster Autoscaler](#cluster-autoscaler-without-the-combine-imds-proxy)). |
| PersistentVolumeClaims stay in `Pending` | Pods cannot reach IMDS (see [AWS EBS CSI Driver](1-guidance.md#aws-ebs-csi-driver)). |

## With the Combine IMDS Proxy

:::info[Combine 3.15.2 and later]
The Combine IMDS Proxy is available only in Combine 3.15.2 and later.
:::

With the [Combine IMDS Proxy](../10-advanced-features/imds-proxy.md) installed on each Node, every process and Pod on the Node reads emulated values from IMDS. With one more `nodeadm` configuration file, the Node's kubelet also joins the Cluster through the Combine Kubernetes Proxy. The Node then bootstraps, joins, and runs against the emulated Partition.

This section covers Amazon Linux 2023 Nodes. For the Combine IMDS Proxy itself (its Configuration, verification, and uninstall), see [Combine IMDS Proxy](../10-advanced-features/imds-proxy.md).

### Why kubelet Must Use the Combine Kubernetes Proxy

kubelet authenticates to the Cluster with a token that `nodeadm` configures from the Region that IMDS reports. With the Combine IMDS Proxy, that is the emulated Region, so the token is signed for the emulated STS endpoint (`sts.us-iso-east-1.c2s.ic.gov`):

- **Sent to the Cluster's own endpoint**, the token is rejected. The EKS control plane validates tokens against STS in the host Region, so kubelet gets `Unauthorized` and the Node goes `NotReady`.
- **Sent to the Combine Kubernetes Proxy**, the token is re-signed. Combine re-signs it for STS in the host Region with the Node IAM Role (see [Resource Role Masquerade](../10-advanced-features/resource-role-masquerade.md)), using the EC2 Instance ID as the session name, just as the EC2 Instance's own credentials do. EKS then authenticates kubelet as `system:node:<Node name>`, exactly as it would without Combine.

The UserData that EKS generates for a managed node group points kubelet at the Cluster's own endpoint. The `nodeadm` configuration file in [Step 2](#step-2-add-the-combine-imds-proxy-to-the-launch-template) replaces it with the Combine Kubernetes Proxy endpoint.

:::warning
Do not install the Combine IMDS Proxy on an EKS Node without the `nodeadm` configuration file. The Node keeps working until its next reboot. Then `nodeadm` configures kubelet for the emulated Region against the Cluster's own endpoint, kubelet gets `Unauthorized`, and the Node does not rejoin the Cluster.
:::

### Requirements

- **Amazon Linux 2023 EKS AMIs**, which bootstrap with `nodeadm`. This section does not cover Amazon Linux 2, Bottlerocket, or Windows Nodes, Fargate, or Karpenter-provisioned Nodes. Contact the Combine Support Team before you use the Combine IMDS Proxy with them.
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

### Step 1: Prepare the Cluster

Make these changes before Nodes with the Combine IMDS Proxy join the Cluster. They are safe on Nodes without it.

#### VPC CNI

The VPC CNI (`aws-node`) reads the Region from IMDS, so it calls EC2 through Combine. It verifies TLS with its own certificate bundle, not the Node's, so it rejects Combine's certificate until you give it the Node's bundle. Without this change, `aws-node` fails with `x509: certificate signed by unknown authority`, and new Pods get no IP address.

For the `vpc-cni` EKS managed add-on, set these configuration values:

```json
{
  "extraVolumes": [ { "name": "host-ca-bundle", "hostPath": { "path": "/etc/pki/ca-trust/extracted/pem", "type": "Directory" } } ],
  "extraVolumeMounts": [ { "name": "host-ca-bundle", "mountPath": "/host-ca", "readOnly": true } ],
  "extraEnv": [ { "name": "SSL_CERT_FILE", "value": "/host-ca/tls-ca-bundle.pem" } ]
}
```

If you manage `aws-node` yourself, add the same volume, volume mount, and `SSL_CERT_FILE` environment variable to the `aws-node` container of the `aws-node` DaemonSet.

On a Node without the Combine Certificate Authority, the Node's bundle still holds the public Certificate Authorities, so `aws-node` keeps working there.

#### AWS EBS CSI Driver

The EBS CSI node plugin (`ebs-csi-node`) runs as a Pod, so it reads the emulated Availability Zone from IMDS. That collides with the host Availability Zone in the Node's `topology.kubernetes.io/zone` label, and the plugin fails to register with `topology value collision`. Have it read the Node's labels instead of IMDS:

- For the `aws-ebs-csi-driver` EKS managed add-on, set the configuration values `{"node":{"metadataSources":"kubernetes"}}`.
- For the Helm chart, set `node.metadataSources=kubernetes`.

#### Your Workloads and Other Add-Ons

Any Pod that reads its Region from IMDS now calls the emulated AWS Service Endpoints, so it must trust the Combine Certificate Authority (for example, with `AWS_CA_BUNDLE` for the AWS CLI and Python SDK, or `SSL_CERT_FILE` for Go).

A Pod that sets its Region explicitly ignores IMDS and keeps calling that Region:

- **IRSA.** For every Pod whose ServiceAccount has the `eks.amazonaws.com/role-arn` annotation, EKS injects `AWS_REGION` and `AWS_DEFAULT_REGION` set to the host Region. To send such a Pod's AWS API Calls through Combine, set `AWS_REGION` and `AWS_DEFAULT_REGION` to the emulated Region in the Pod spec. EKS does not replace a value that the Pod spec sets.
- **The `aws-ebs-csi-driver` managed add-on** sets `AWS_REGION` to the host Region on its controller. Leave it that way: the controller creates each EBS Volume in the Availability Zone from the Node's `topology.kubernetes.io/zone` label, which holds the host Availability Zone.

### Step 2: Add the Combine IMDS Proxy to the Launch Template

For an EKS managed node group that uses an EKS AMI, add this part to the UserData of the node group's launch template. EKS adds its own `nodeadm` configuration to the UserData. Set:

- `CLUSTER_NAME` to the Cluster name.
- `PACKAGE_URL` to a URL that the Node can download the Combine IMDS Proxy package from while it boots, without credentials. Use a web server inside the Combine VPC, or an S3 presigned URL that you create through Combine for the emulated Region. The Combine Firewall blocks presigned URLs for S3 in the host Region. A presigned URL stops working when it expires (after at most 7 days, or sooner if the credentials that created it expire first), and Nodes that launch after that cannot install the Combine IMDS Proxy. For a node group that scales, use a web server.
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

`nodeadm` bootstraps the Node in two passes, and this UserData runs between them. So the Combine IMDS Proxy and the `nodeadm` configuration file are in place before kubelet starts, on the first boot and on every boot after. For each step, see [A Node's First Boot](#a-nodes-first-boot).

The script stops with an error if `DescribeCluster` does not return a Combine Kubernetes Proxy endpoint, for example because the Combine Kubernetes Proxy is disabled for the Cluster. Its output is in `/var/log/combine-imds-proxy-userdata.log`.

### Custom AMIs and Self-Managed Nodes

If you build your own AMI or run self-managed Nodes, you supply the complete `nodeadm` configuration in the UserData yourself:

- Bake the Combine Certificate Authority and the Combine IMDS Proxy into the AMI (see [Bake into an AMI](../10-advanced-features/imds-proxy.md#bake-into-an-ami)). `nodeadm` then reads emulated values from the first boot.
- Set `apiServerEndpoint` and `certificateAuthority` in the `NodeConfig` to the `endpoint` and `certificateAuthority.data` that `aws eks describe-cluster` returns when you call it through Combine. You do not need the `/etc/eks/nodeadm.d/` file.

### TerraForm Example

[Download the TerraForm example](./combine-eks-imds-proxy-example.zip) for a complete EKS Cluster whose Nodes run the Combine IMDS Proxy. It is a single TerraForm root module that applies every step in this section, in the order in [Building the Cluster](#building-the-cluster):

| File | What it shows |
| --- | --- |
| `iam.tf` | The Cluster and Node IAM Roles, prefixed with `PROJECT_`, with an optional permissions boundary. Their ARNs and Service Principals come from the provider for the emulated Partition. |
| `cluster.tf` | A private EKS Cluster, the Security Group rule for the Combine Endpoint Server, and the `vpc-cni` and `aws-ebs-csi-driver` add-ons configured as in [Step 1](#step-1-prepare-the-cluster). The `vpc-cni` add-on is created before the Nodes. |
| `nodes.tf`, `node-user-data.tftpl` | The launch template with the UserData from [Step 2](#step-2-add-the-combine-imds-proxy-to-the-launch-template), and an EKS managed node group on the Amazon Linux 2023 EKS AMI. |
| `variables.tf`, `terraform.tfvars.example` | Every value you supply, with defaults for the US Top Secret Partition (C2S). |

To try it, extract the archive, copy `terraform.tfvars.example` to `terraform.tfvars`, fill in your values, and run `terraform init` and `terraform apply`. Run TerraForm from inside the Combine VPC (for example, from the Combine Proxy), with `WLDEVELOPER` credentials and the Combine Certificate Authority trusted, as for any other work in Combine. The archive's `README.md` lists every value and how to verify the result.

To use it as a reference for your own TerraForm, keep these parts, however you organize your modules:

- **The Node UserData** (`node-user-data.tftpl`), including the `nodeadm` configuration file.
- **The `vpc-cni` add-on configuration values**, and the dependency that creates the add-on before the node group.
- **The `aws-ebs-csi-driver` add-on configuration value** `node.metadataSources`.
- **The Security Group rule** that lets the Combine Endpoint Server reach the Cluster API.
- **The IAM Role names and permissions boundary** that your Combine Deployment requires.

### Cluster Autoscaler

A Node that runs the Combine IMDS Proxy registers with the ISO Availability Zone (`aws:///us-iso-east-1a/...`), and Combine returns ISO Availability Zones to the autoscaler by default. So the autoscaler matches these Nodes and scales their node groups up and down with no exemption.

The [Cluster Autoscaler exemption](#cluster-autoscaler-without-the-combine-imds-proxy) reverses this. It makes Combine return commercial Availability Zones to the autoscaler, which then matches only Nodes that do not run the Combine IMDS Proxy:

| Node | Exemption not set (the default) | Exemption set |
| --- | --- | --- |
| Runs the Combine IMDS Proxy | Matched | Not matched |
| Does not run the Combine IMDS Proxy | Not matched | Matched |

- **Do not set the exemption** for node groups whose Nodes run the Combine IMDS Proxy.
- **Do not mix the two kinds of Node** in the node groups the autoscaler manages. The autoscaler reports a Node it cannot match as unregistered and cannot scale it down. It also treats that Node's instance as unregistered, and it removes instances that stay unregistered for longer than `--max-node-provision-time` (15 minutes by default).
- **Set the autoscaler's Region explicitly.** If the autoscaler uses IRSA, EKS injects `AWS_REGION` set to the host Region into its Pod. Set the emulated Region with the Helm chart's `awsRegion` value (or the `AWS_REGION` environment variable), and give the autoscaler the Combine Certificate Authority, so that its AWS API Calls go through Combine.

To check, look at the `cluster-autoscaler-status` ConfigMap in the `kube-system` namespace. Each node group should report its Nodes under `registered`, with `unregistered: 0`. The autoscaler's log reports a Node that it cannot match as `node is not present in aws: could not find instance`.

#### Moving a Cluster From the Exemption

If the autoscaler already uses the exemption, move the Cluster in this order, so that the autoscaler never sees a mix of the two kinds of Node:

1. Scale the autoscaler Deployment to `0` replicas.
2. Add the Combine IMDS Proxy to the launch template of every node group that the autoscaler manages (see [Step 2](#step-2-add-the-combine-imds-proxy-to-the-launch-template)), and let each node group replace its Nodes. Every Node must register again, because `spec.providerID` cannot change after a Node registers.
3. Delete both exemption Configuration Values, `combine.endpoints.aws.rewriter.response.autoscaling.availabilityZone.enable.roleArn.contains.except` and `combine.endpoints.aws.rewriter.response.autoscaling.availabilityZone.enable.userAgents.except` (see [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md)). Combine applies the change within a minute.
4. Scale the autoscaler Deployment back up, and check the `cluster-autoscaler-status` ConfigMap.

### Verify

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

### Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| The Node goes `NotReady` after a reboot, and `journalctl -u kubelet` shows `Unauthorized` | kubelet uses the Cluster's own endpoint. The `nodeadm` configuration file is missing, or holds the Cluster's own endpoint. Check `/etc/eks/nodeadm.d/` and the `server:` line in `/var/lib/kubelet/kubeconfig`. |
| kubelet gets `Forbidden`, or the Node never registers, and the Combine Log shows the Default Role for kubelet's requests | Combine could not assume the Node IAM Role. Check its trust policy (see [Requirements](#requirements)) and look for a **Could Not Assume Role** Alert Event. |
| kubelet reports `x509: certificate signed by unknown authority` | The `certificateAuthority` in the `nodeadm` configuration does not include the Combine Certificate Authority. Call `DescribeCluster` through Combine to get it. |
| The UserData stops at `aws eks describe-cluster` | The Node IAM Role lacks `eks:DescribeCluster`, the Combine Certificate Authority is not installed, or the Combine Kubernetes Proxy is disabled for the Cluster or the Node. |
| A new Node has a host Availability Zone in its provider ID (`aws:///us-east-1a/...`) | The Node does not run the Combine IMDS Proxy. The UserData stopped before it installed it, for example because `PACKAGE_URL` expired. Check `/var/log/combine-imds-proxy-userdata.log`. |
| New Pods stay in `ContainerCreating`, and `/var/log/aws-routed-eni/ipamd.log` shows `x509` errors | `aws-node` does not trust the Combine Certificate Authority (see [VPC CNI](#vpc-cni)). |
| `ebs-csi-node` does not start and logs `topology value collision` | The EBS CSI node plugin reads IMDS (see [AWS EBS CSI Driver](#aws-ebs-csi-driver)). |
| A Pod fails with `x509` errors when it calls AWS | The Pod does not trust the Combine Certificate Authority (see [Your Workloads and Other Add-Ons](#your-workloads-and-other-add-ons)). |

### Known Limitations

- **Calls from inside the Cluster bypass Combine.** Controllers, add-ons, and Pods that call the Kubernetes API through `kubernetes.default.svc` reach the EKS control plane directly. They see host values in Node labels, and the Combine Kubernetes Proxy does not rewrite their requests.
- **By default, Combine signs the calls of a Pod that uses the Node IAM Role's credentials with the Default Role.** Combine matches a caller to an EC2 Instance by the EC2 Instance's primary private IP address. kubelet and host-network Pods use that address, so Combine signs their calls with the Node IAM Role. Other Pods have their own IP addresses. To have Combine match those to the Node too, including IP addresses from VPC CNI prefix delegation, set `combine.endpoints.aws.authorization.resourceRole.masquerade.secondaryIpAddress` to `true` (see [Resource Role Masquerade](../10-advanced-features/resource-role-masquerade.md#configuration)). To give a Pod its own IAM Role, use IRSA.
- **Existing Nodes keep their provider ID.** `spec.providerID` cannot change after a Node registers, so Nodes that registered before you installed the Combine IMDS Proxy keep host Availability Zones in it. Replace them so that every Node registers again. This matters for the Cluster Autoscaler, which cannot work with a mix of the two kinds of Node (see [Cluster Autoscaler](#cluster-autoscaler)).
- **The Combine Endpoint Server carries kubelet traffic.** Each Node's kubelet holds several long-lived connections to the Combine Endpoint Server and renews its Node lease through it every 10 seconds. Plan Endpoint Server capacity for the number of Nodes.

## Appendix: Under the Hood

This appendix shows, step by step, how a Cluster whose Nodes run the Combine IMDS Proxy is built, how a Node boots and joins it, and which traffic still goes to the host Region.

### Building the Cluster

Make every AWS API Call through Combine, from inside the Combine VPC. The [TerraForm Example](#terraform-example) follows this order.

1. **The IAM Roles.** Create the Cluster IAM Role and the Node IAM Role through Combine, so that Combine adds itself to their trust policies. Without that trust, Combine cannot act as the Node IAM Role, and kubelet's requests get the Default Role. The Node IAM Role needs `AmazonEKSWorkerNodePolicy` (which includes `eks:DescribeCluster`), `AmazonEKS_CNI_Policy`, and `AmazonEC2ContainerRegistryReadOnly`.
2. **The Cluster**, with private endpoint access, and a Security Group rule that lets the Combine Endpoint Server reach the Cluster API on port `443`. The Combine Kubernetes Proxy uses that rule to reach the Cluster's own endpoint.
3. **The `vpc-cni` add-on, before any Node**, with the configuration values from [VPC CNI](#vpc-cni). A Node that starts before this cannot give Pods IP addresses.
4. **A launch template** with the UserData from [Step 2](#step-2-add-the-combine-imds-proxy-to-the-launch-template), an IMDS hop limit of `2`, and no AMI ID.
5. **An EKS managed node group** that uses the launch template, with an Amazon Linux 2023 AMI type (for example, `AL2023_x86_64_STANDARD`). EKS picks the EKS AMI, creates the Auto Scaling Group, and adds its own `nodeadm` configuration to your UserData. You do not need your own Auto Scaling Group.
6. **The `aws-ebs-csi-driver` add-on**, with the configuration value from [AWS EBS CSI Driver](#aws-ebs-csi-driver).

### A Node's First Boot

On the Amazon Linux 2023 EKS AMI, `nodeadm` bootstraps the Node in two systemd passes, and your UserData runs between them. That is how the Combine Certificate Authority and the Combine IMDS Proxy are in place before kubelet starts.

| Step | What happens | Where the traffic goes |
| --- | --- | --- |
| 1 | The node group's Auto Scaling Group launches the EC2 Instance. Its UserData holds the EKS `NodeConfig` (the Cluster's own endpoint, the Cluster Certificate Authority, and the service CIDR) and your script. | — |
| 2 | `nodeadm-config.service` reads the UserData from IMDS and writes its configuration. It sees host values, because the Combine IMDS Proxy is not installed yet. It does not start kubelet. | IMDS |
| 3 | `cloud-final.service` runs your script. Its step 1 adds the Combine Certificate Authority to the Node's trust store. | The Node only |
| 4 | Its step 2 downloads, installs, and starts the Combine IMDS Proxy. From here on, IMDS reports emulated values (`us-iso-east-1`). | `PACKAGE_URL` |
| 5 | Its step 3 calls `aws eks describe-cluster`. The AWS CLI takes the Region from IMDS, so it calls `eks.us-iso-east-1.c2s.ic.gov`, which resolves to the Combine Endpoint Server inside the Combine VPC. Combine matches the Node by its IP address and calls EKS as the Node IAM Role. It returns the Combine Kubernetes Proxy endpoint and a Certificate Authority bundle that holds both the Cluster's and Combine's Certificate Authorities. The script writes them to `/etc/eks/nodeadm.d/10-combine-kubernetes-proxy.yaml`. | Combine |
| 6 | `nodeadm-run.service` runs after `cloud-final.service`. It merges that file over the EKS `NodeConfig`: the endpoint and Certificate Authority come from the file, and the rest (such as the Cluster name and service CIDR) from EKS. Because the configuration changed, it reads the EC2 Instance's details from IMDS again, now emulated, writes kubelet's configuration, and starts kubelet. | IMDS, through the Combine IMDS Proxy |
| 7 | kubelet gets its token from `aws eks get-token --region us-iso-east-1`: a presigned STS `GetCallerIdentity` request for the emulated Region. kubelet sends the token to the Combine Kubernetes Proxy, which re-signs it for STS in the host Region as the Node IAM Role, with the EC2 Instance ID as the session name. The EKS control plane checks the token with STS and authenticates kubelet as `system:node:<Node name>`. The Node itself never calls STS. | Combine |
| 8 | kubelet registers the Node with an emulated provider ID (`aws:///us-iso-east-1a/i-...`). It renews the Node's lease through Combine every 10 seconds. | Combine |
| 9 | The DaemonSets start (`aws-node`, `kube-proxy`, `ebs-csi-node`). containerd pulls their images from ECR in the host Region, or through Combine if the [Combine EKS Add-On Rewriter](2-guidance-add-ons.md#with-the-combine-eks-add-on-rewriter) has rewritten them. | ECR in the host Region, through the Combine Firewall exemptions, or Combine |
| 10 | `aws-node` calls EC2 for Network Interfaces and IP addresses, in the Region from IMDS. It runs on the host network, so Combine matches it to the Node and signs as the Node IAM Role. | Combine |
| 11 | Pods that call `kubernetes.default.svc` (`aws-node`, CoreDNS, and others) reach the EKS control plane's network interfaces in your VPC directly. | The EKS control plane, inside the VPC |

On every later boot, the Combine IMDS Proxy starts before `nodeadm-config.service`, and the file from step 5 is still in place. `nodeadm` reads emulated values and the Combine Kubernetes Proxy endpoint from the start, and the Node rejoins the same way. This is also why a Node that runs the Combine IMDS Proxy without that file fails to rejoin after a reboot (see [Why kubelet Must Use the Combine Kubernetes Proxy](#why-kubelet-must-use-the-combine-kubernetes-proxy)).

### A Node Without the Combine IMDS Proxy

For comparison, a Node without the Combine IMDS Proxy boots like this:

1. `nodeadm` reads host values from IMDS and configures kubelet with the EKS `NodeConfig` from the UserData, which points at the Cluster's own endpoint.
2. kubelet's token is signed for STS in the host Region, and kubelet sends it to the Cluster's own endpoint. With private endpoint access, that connection stays inside the VPC. Combine is not involved.
3. kubelet registers the Node with a host provider ID (`aws:///us-east-1a/i-...`).
4. containerd pulls the DaemonSet images from ECR in the host Region, and `aws-node` calls EC2 in the host Region, both through the Combine Firewall exemptions.

### What Still Reaches the Host Region

With the Combine IMDS Proxy, everything that makes a Node join and stay in the Cluster goes through Combine. This traffic still goes to the host Region directly:

| Traffic | Host endpoints | To change it |
| --- | --- | --- |
| **EKS add-on images** (`aws-node`, `kube-proxy`, CoreDNS, the EBS CSI Driver, and others). kubelet's credential provider gets an ECR token, then containerd pulls the image manifest and layers. | `api.ecr.<region>`, `<account>.dkr.ecr.<region>`, and the S3 bucket that ECR serves image layers from, through the Combine Firewall exemptions | Install the [Combine EKS Add-On Rewriter](2-guidance-add-ons.md#with-the-combine-eks-add-on-rewriter), which rewrites add-on images to the emulated ECR registries as Pods are created. Combine then proxies the pulls. |
| **The EBS CSI controller.** The `aws-ebs-csi-driver` add-on sets `AWS_REGION` to the host Region, because the controller must create EBS Volumes in the host Availability Zones from the Node labels. | `ec2.<region>`, and `sts.<region>` with IRSA, through the exemptions | Leave it on the host Region (see [Your Workloads and Other Add-Ons](#your-workloads-and-other-add-ons)). |
| **IRSA Pods.** EKS injects `AWS_REGION` set to the host Region. | Whatever the Pod calls. The Combine Firewall allows only the exempted endpoints and blocks the rest. | Set `AWS_REGION` and `AWS_DEFAULT_REGION` to the emulated Region in the Pod spec. |
| **Controllers left on the host Region**, such as the AWS Load Balancer Controller or the Cluster Autoscaler | `elasticloadbalancing.<region>` (exempt). Auto Scaling is blocked. | Set the emulated Region, and give them the Combine Certificate Authority. |
| **Package installs** with `dnf` | The Amazon Linux 2023 package repository, through the exemptions | Needed only if something on the Node installs packages. |
| **NTP** to public servers | Blocked by the Combine Firewall | Nothing. The Node keeps time with the Amazon Time Sync Service (`169.254.169.123`), which is link-local. |
