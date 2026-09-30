# Configure Combine on EKS with Helm

:::tip[Work in Progress]

This tutorial may change as we continue to refine it.

:::

This tutorial walks you through installing Combine on an Amazon EKS cluster from the Combine Team's Helm repository, and sending the Combine logs to CloudWatch with CloudWatch Container Insights and Fluent Bit.

## Before You Begin

- The Combine Team must allow your AWS Account ID to access the Combine Team's ECR registries, where the Combine images are stored.
- These instructions are written for an EKS cluster created with EKS Auto Mode. In EKS Auto Mode, AWS manages the VPC CNI, CoreDNS, and kube-proxy, so they do not appear in the cluster.
- The snippets use `us-east-1` as the Region. This is the host Region of your Combine Deployment, not an emulated Region.
- Choose the cluster name before you create the cluster. The subnet tags in [Step 1](#step-1-tag-the-cluster-subnets) contain the cluster name and must be present before the cluster is created.

### Placeholders

Replace these placeholders in the commands, policies, and Helm values on this page:

| Placeholder | Replace with |
| --- | --- |
| `CLUSTER_NAME` | The name of your EKS cluster. |
| `ACCOUNT_NUMBER` | Your AWS Account ID (the account that hosts your Combine Deployment). |
| `COMBINE_TEAM_ACCOUNT_NUMBER` | The AWS Account ID that hosts the Combine Team's ECR registry. |
| `YOUR_OIDC_ID` | The ID of your cluster's OIDC provider. |
| `COMBINE_NAMESPACE` | The namespace you install Combine into (`combine` in [Step 6](#step-6-install-combine)). |
| `SHARD_ID` | Only for a sharded Combine Deployment: the Shard ID, in lowercase. |

## Step 1: Tag the Cluster Subnets

The Load Balancers for the Endpoint Server and the TAP Server are placed in subnets according to their tags. Complete this step before you create the cluster.

Tag the subnets for the Endpoint Server's Load Balancer, which is internal to the VPC by default, with:

```text
kubernetes.io/role/internal-elb: 1
kubernetes.io/cluster/CLUSTER_NAME: owned
```

Tag the subnets for the TAP Server's Load Balancer, which is open to the public internet by default, with:

```text
kubernetes.io/role/elb: 1
kubernetes.io/cluster/CLUSTER_NAME: owned
```

## Step 2: Add the Cluster's OIDC Provider to IAM

IRSA lets the Combine Pods assume IAM Roles through the cluster's OIDC provider. After you create the cluster, add its OIDC provider as an identity provider in IAM, with the audience `sts.amazonaws.com`.

## Step 3: Create the IAM Roles for the Combine ServiceAccounts

The Endpoint Server and the TAP Server each run under their own ServiceAccount and IAM Role. Create one IAM Role for each. This tutorial names them `combine-endpoints-irsa-role` and `combine-tap-irsa-role`, and later steps use these names.

In the trust policies, replace `YOUR_OIDC_ID` and `COMBINE_NAMESPACE` as described in [Placeholders](#placeholders). Both trust policies also let the `cloudwatch-agent` ServiceAccount in the `amazon-cloudwatch` namespace assume the role. [Step 5](#step-5-install-amazon-cloudwatch-observability) creates that ServiceAccount.

The S3 bucket in the permissions is the Combine DevOps bucket, `combine-devops-ACCOUNT_NUMBER-us-east-1`. If you have a sharded (namespaced) Combine Deployment, the bucket is named `combine-SHARD_ID-devops-ACCOUNT_NUMBER-us-east-1` instead, with the Shard ID in lowercase.

### Endpoint Server Role

Create `combine-endpoints-irsa-role` with the following permissions and trust policy.

<details>
  <summary>Permissions</summary>

```json
[
  {
    "Sid": "VisualEditor0",
    "Effect": "Allow",
    "Action": "logs:*",
    "Resource": "*"
  },
  {
    "Sid": "VisualEditor1",
    "Effect": "Allow",
    "Action": "s3:GetObject",
    "Resource": [
      "arn:aws:s3:::combine-devops-ACCOUNT_NUMBER-us-east-1/releases/*",
      "arn:aws:s3:::combine-devops-ACCOUNT_NUMBER-us-east-1/certificates/*"
    ]
  },
  {
    "Action": [
      "cloudwatch:PutMetricData",
      "dynamodb:*",
      "ec2:DescribeInstances",
      "ec2:DescribeTags",
      "ec2:DescribeVolumes",
      "iam:GetRole",
      "iam:ListInstanceProfiles",
      "kms:Decrypt",
      "kms:DescribeKey",
      "kms:Encrypt",
      "kms:GenerateDataKey*",
      "kms:ReEncrypt*",
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:PutLogEvents",
      "rds:DescribeDBClusters",
      "rds:DescribeDBInstances",
      "s3:*",
      "secretsmanager:ListSecrets",
      "sns:*",
      "ssm:GetParameter",
      "sts:*"
    ],
    "Resource": [
      "*"
    ],
    "Effect": "Allow"
  },
  {
    "Action": [
      "secretsmanager:*"
    ],
    "Resource": "arn:aws:secretsmanager:*:ACCOUNT_NUMBER:secret:combine/*",
    "Effect": "Allow"
  },
  {
    "Effect": "Allow",
    "Action": [
      "ssm:DescribeAssociation",
      "ssm:GetDeployablePatchSnapshotForInstance",
      "ssm:GetDocument",
      "ssm:DescribeDocument",
      "ssm:GetManifest",
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:ListAssociations",
      "ssm:ListInstanceAssociations",
      "ssm:PutInventory",
      "ssm:PutComplianceItems",
      "ssm:PutConfigurePackageResult",
      "ssm:UpdateAssociationStatus",
      "ssm:UpdateInstanceAssociationStatus",
      "ssm:UpdateInstanceInformation"
    ],
    "Resource": "*"
  },
  {
    "Effect": "Allow",
    "Action": [
      "ssmmessages:CreateControlChannel",
      "ssmmessages:CreateDataChannel",
      "ssmmessages:OpenControlChannel",
      "ssmmessages:OpenDataChannel"
    ],
    "Resource": "*"
  },
  {
    "Effect": "Allow",
    "Action": [
      "ec2messages:AcknowledgeMessage",
      "ec2messages:DeleteMessage",
      "ec2messages:FailMessage",
      "ec2messages:GetEndpoint",
      "ec2messages:GetMessages",
      "ec2messages:SendReply"
    ],
    "Resource": "*"
  }
]
```
</details>

<details>
  <summary>Trust</summary>

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_NUMBER:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/YOUR_OIDC_ID"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "oidc.eks.us-east-1.amazonaws.com/id/YOUR_OIDC_ID:aud": "sts.amazonaws.com",
          "oidc.eks.us-east-1.amazonaws.com/id/YOUR_OIDC_ID:sub": "system:serviceaccount:COMBINE_NAMESPACE:combine-endpoints-sa"
          }
      }
    },
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_NUMBER:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/YOUR_OIDC_ID"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "oidc.eks.us-east-1.amazonaws.com/id/YOUR_OIDC_ID:aud": "sts.amazonaws.com",
          "oidc.eks.us-east-1.amazonaws.com/id/YOUR_OIDC_ID:sub": "system:serviceaccount:amazon-cloudwatch:cloudwatch-agent"
          }
      }
    }
  ]
}
```
</details>

### TAP Server Role

Create `combine-tap-irsa-role` with the following permissions and trust policy.

<details>
  <summary>Permissions</summary>

```json
[
  {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ssm:DescribeAssociation",
                "ssm:GetDeployablePatchSnapshotForInstance",
                "ssm:GetDocument",
                "ssm:DescribeDocument",
                "ssm:GetManifest",
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:ListAssociations",
                "ssm:ListInstanceAssociations",
                "ssm:PutInventory",
                "ssm:PutComplianceItems",
                "ssm:PutConfigurePackageResult",
                "ssm:UpdateAssociationStatus",
                "ssm:UpdateInstanceAssociationStatus",
                "ssm:UpdateInstanceInformation"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ssmmessages:CreateControlChannel",
                "ssmmessages:CreateDataChannel",
                "ssmmessages:OpenControlChannel",
                "ssmmessages:OpenDataChannel"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ec2messages:AcknowledgeMessage",
                "ec2messages:DeleteMessage",
                "ec2messages:FailMessage",
                "ec2messages:GetEndpoint",
                "ec2messages:GetMessages",
                "ec2messages:SendReply"
            ],
            "Resource": "*"
        }
    ]
},
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "cloudwatch:PutMetricData",
                "dynamodb:*",
                "ec2:DescribeInstances",
                "ec2:DescribeTags",
                "ec2:DescribeVolumes",
                "ec2:DescribeVpcs",
                "elasticloadbalancing:DescribeLoadBalancers",
                "elasticloadbalancing:DescribeTags",
                "kms:Decrypt",
                "kms:DescribeKey",
                "kms:Encrypt",
                "kms:GenerateDataKey*",
                "kms:ReEncrypt*",
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "logs:PutLogEvents",
                "network-firewall:*RuleGroup*",
                "s3:ListAllMyBuckets",
                "s3:ListBucket",
                "secretsmanager:ListSecrets",
                "sns:*",
                "ssm:GetParameter",
                "sts:AssumeRole"
            ],
            "Resource": [
                "*"
            ],
            "Effect": "Allow"
        },
        {
            "Action": [
                "secretsmanager:*"
            ],
            "Resource": "arn:aws:secretsmanager:*:ACCOUNT_NUMBER:secret:combine/*",
            "Effect": "Allow"
        },
        {
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::combine-*",
                "arn:aws:s3:::combine-*/*"
            ],
            "Effect": "Allow"
        }
    ]
},
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "logs:*",
            "Resource": "*"
        }
    ]
},
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "s3:GetObject",
            "Resource": [
                "arn:aws:s3:::combine-devops-ACCOUNT_NUMBER-us-east-1/releases/*",
                "arn:aws:s3:::combine-devops-ACCOUNT_NUMBER-us-east-1/certificates/*"
            ]
        }
    ]
}
]


```
</details>

<details>
  <summary>Trust</summary>

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::ACCOUNT_NUMBER:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/YOUR_OIDC_ID"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "oidc.eks.us-east-1.amazonaws.com/id/YOUR_OIDC_ID:aud": "sts.amazonaws.com",
                    "oidc.eks.us-east-1.amazonaws.com/id/YOUR_OIDC_ID:sub": "system:serviceaccount:COMBINE_NAMESPACE:combine-tap-sa"
                }
            }
        },
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::ACCOUNT_NUMBER:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/YOUR_OIDC_ID"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "oidc.eks.us-east-1.amazonaws.com/id/YOUR_OIDC_ID:aud": "sts.amazonaws.com",
                    "oidc.eks.us-east-1.amazonaws.com/id/YOUR_OIDC_ID:sub": "system:serviceaccount:amazon-cloudwatch:cloudwatch-agent"
                }
            }
        }
    ]
}
```

</details>

## Step 4: Log In to the Combine Team's ECR Registry

The Combine Helm chart is stored in the Combine Team's ECR registry. Log your Helm client in to that registry.

_NOTE: You log in to the Combine Team's ECR registry, so `COMBINE_TEAM_ACCOUNT_NUMBER` is a different account from the `ACCOUNT_NUMBER` in the previous steps._

```bash
aws ecr get-login-password --region us-east-1 \
  | helm registry login --username AWS --password-stdin \
    COMBINE_TEAM_ACCOUNT_NUMBER.dkr.ecr.us-east-1.amazonaws.com
```

## Step 5: Install Amazon CloudWatch Observability

The Amazon CloudWatch Observability Helm chart installs the CloudWatch agent and Fluent Bit in the cluster. The values in this step send the Endpoint Server and TAP Server container logs to their own Log Groups, and exclude them from the default Container Insights application Log Group. For more about the Combine logs, see [View Combine Logs](how-to-view-combine-logs.md).

_NOTE: To access the cluster (for example, with `kubectl`), you might have to add an IAM Access Entry to the cluster or use another access method, such as a ConfigMap. [Step 8](#step-8-test-the-deployment) shows how to update your kubeconfig for the cluster._

Save the following as `cloudwatch-helm-values.yaml`. Replace `CLUSTER_NAME` in `clusterName` and `ACCOUNT_NUMBER` in the role ARN.

<details>
  <summary>CloudWatch Helm Values</summary>

```yaml
clusterName: CLUSTER_NAME
region: us-east-1

agent:
  serviceAccount:
    create: true
    name: cloudwatch-agent
    annotations:
      eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT_NUMBER:role/combine-endpoints-irsa-role

containerLogs:
  enabled: true
  fluentBit:
    serviceAccount:
      name: cloudwatch-agent

    config:
      extraFiles:
        application-custom.conf: |
          [INPUT]
            Name              tail
            Tag               combine.var.log.containers.*
            Path              /var/log/containers/*.log
            DB                /var/fluent-bit/state/flb_combine.db
            Mem_Buf_Limit     50MB
            Skip_Long_Lines   Off
            Refresh_Interval  10
            multiline.parser  cri

          [FILTER]
            Name                kubernetes
            Match               combine.var.log.containers.*
            Kube_Tag_Prefix     combine.var.log.containers.
            Kube_URL            https://kubernetes.default.svc:443
            Merge_Log           On
            Keep_Log            On
            Use_Kubelet         On
            Kubelet_Port        10250
            Buffer_Size         0
            Use_Pod_Association Off

          [FILTER]
            Name   rewrite_tag
            Match  combine.var.log.containers.*
            Rule $kubernetes['pod_name']  combine-tap-        tap.logs        true

          [FILTER]
            Name   rewrite_tag
            Match  combine.var.log.containers.*
            Rule $kubernetes['pod_name']  combine-endpoints-  endpoints.logs  true

          # Send each to its own log group (STATIC names => no template drama)
          [OUTPUT]
            Name               cloudwatch_logs
            Match              endpoints.logs
            region             us-east-1
            log_group_name     ${CLUSTER_NAME}-endpoints
            log_stream_prefix  ${HOST_NAME}-
            auto_create_group  true
            log_retention_days 30
            log_key            log

          [OUTPUT]
            Name               cloudwatch_logs
            Match              tap.logs
            region             us-east-1
            log_group_name     ${CLUSTER_NAME}-tap
            log_stream_prefix  ${HOST_NAME}-
            auto_create_group  true
            log_retention_days 30
            log_key            log

          # [OUTPUT]
          #   Name   stdout
          #   Match  endpoints.logs

        # OVERRIDE THE DEFAULT APP PIPELINE TO EXCLUDE COMBINE
        application-log.conf: |
          [INPUT]
            Name                tail
            Tag                 application.*
            Exclude_Path        /var/log/containers/cloudwatch-agent*, /var/log/containers/fluent-bit*, /var/log/containers/aws-node*, /var/log/containers/kube-proxy*, /var/log/containers/combine*.log
            Path                /var/log/containers/*.log
            multiline.parser    docker, cri
            DB                  /var/fluent-bit/state/flb_container.db
            Mem_Buf_Limit       50MB
            Skip_Long_Lines     On
            Refresh_Interval    10
            Rotate_Wait         30
            storage.type        filesystem
            Read_from_Head      ${READ_FROM_HEAD}

          [INPUT]
            Name                tail
            Tag                 application.*
            Path                /var/log/containers/fluent-bit*
            multiline.parser    docker, cri
            DB                  /var/fluent-bit/state/flb_log.db
            Mem_Buf_Limit       5MB
            Skip_Long_Lines     On
            Refresh_Interval    10
            Read_from_Head      ${READ_FROM_HEAD}

          [INPUT]
            Name                tail
            Tag                 application.*
            Path                /var/log/containers/cloudwatch-agent*
            multiline.parser    docker, cri
            DB                  /var/fluent-bit/state/flb_cwagent.db
            Mem_Buf_Limit       5MB
            Skip_Long_Lines     On
            Refresh_Interval    10
            Read_from_Head      ${READ_FROM_HEAD}

          [FILTER]
            Name                aws
            Match               application.*
            az                  false
            ec2_instance_id     false
            Enable_Entity       true

          [FILTER]
            Name                kubernetes
            Match               application.*
            Kube_URL            https://kubernetes.default.svc:443
            Kube_Tag_Prefix     application.var.log.containers.
            Merge_Log           On
            Merge_Log_Key       log_processed
            K8S-Logging.Parser  On
            K8S-Logging.Exclude Off
            Labels              Off
            Annotations         Off
            Use_Kubelet         On
            Kubelet_Port        10250
            Buffer_Size         0
            Use_Pod_Association Off

          [OUTPUT]
            Name                cloudwatch_logs
            Match               application.*
            region              ${AWS_REGION}
            log_group_name      /aws/containerinsights/${CLUSTER_NAME}/application
            log_stream_prefix   ${HOST_NAME}-
            auto_create_group   true
            extra_user_agent    container-insights
            add_entity          true
```
</details>

Then install the chart:

```bash
helm repo add aws-observability https://aws-observability.github.io/helm-charts
helm repo update
helm upgrade --install amazon-cloudwatch \
  aws-observability/amazon-cloudwatch-observability \
  -n amazon-cloudwatch --create-namespace \
  -f cloudwatch-helm-values.yaml
```

## Step 6: Install Combine

The Combine Helm chart runs the Endpoint Server and the TAP Server in the cluster. This step installs it into the `combine` namespace.

Save the following as `combine-helm-values.yaml`.

_NOTE: If you have a sharded Combine Deployment, use `combine-SHARD_ID-devops-ACCOUNT_NUMBER-us-east-1` for the DevOps bucket values and `combine-SHARD_ID-configuration` for the Combine Configuration table name, with the Shard ID in lowercase._

<details>
  <summary>Combine Helm Values</summary>

```yaml
endpoints:
  serviceAccount:
    roleArn: arn:aws:iam::ACCOUNT_NUMBER:role/combine-endpoints-irsa-role
    name: combine-endpoints-sa

  env:
    core:
      BucketDevOpsVar: "combine-devops-ACCOUNT_NUMBER-us-east-1"
      BucketDevOpsMasterRegionVar: "combine-devops-ACCOUNT_NUMBER-us-east-1"
      SystemPropertyMasterRegion: "us-east-1"
      SystemPropertyConfigurationTableNameVar: "combine-configuration"

    imdsBypass:
      SYSTEM_PROPERTY_ACCOUNT_ID: "ACCOUNT_NUMBER"
      SYSTEM_PROPERTY_REGION_ID: "us-east-1"
      SYSTEM_PROPERTY_VIRTUAL_NETWORK_ID: "vpc-123456789012"
      SYSTEM_PROPERTY_VIRTUAL_NETWORK_CIDR_BLOCKS: "10.0.0.0/16"

    aws:
      AWS_REGION: "us-east-1"
      AWS_DEFAULT_REGION: "us-east-1"

tap:
  serviceAccount:
    roleArn: arn:aws:iam::ACCOUNT_NUMBER:role/combine-tap-irsa-role
    name: combine-tap-sa

  env:
    core:
      BucketDevOpsVar: "combine-devops-ACCOUNT_NUMBER-us-east-1"
      BucketDevOpsMasterRegionVar: "combine-devops-ACCOUNT_NUMBER-us-east-1"
      SystemPropertyMasterRegion: "us-east-1"
      SystemPropertyConfigurationTableNameVar: "combine-configuration"

    imdsBypass:
      SYSTEM_PROPERTY_ACCOUNT_ID: "ACCOUNT_NUMBER"
      SYSTEM_PROPERTY_REGION_ID: "us-east-1"
      SYSTEM_PROPERTY_VIRTUAL_NETWORK_ID: "vpc-123456789012"
      SYSTEM_PROPERTY_VIRTUAL_NETWORK_CIDR_BLOCKS: "10.0.0.0/16"

    aws:
      AWS_REGION: "us-east-1"
      AWS_DEFAULT_REGION: "us-east-1"
```

</details>

Then install the chart:

```bash
helm upgrade --install combine \
  oci://COMBINE_TEAM_ACCOUNT_NUMBER.dkr.ecr.us-east-1.amazonaws.com/combine \
  -n combine --create-namespace \
  -f combine-helm-values.yaml \
  --set tap.serviceAccount.roleArn=arn:aws:iam::ACCOUNT_NUMBER:role/combine-tap-irsa-role \
  --set endpoints.serviceAccount.roleArn=arn:aws:iam::ACCOUNT_NUMBER:role/combine-endpoints-irsa-role
```

Wait until the Combine Pods are healthy before you continue.

## Step 7: Create DNS Records for the Emulated Domains

Your workload reaches Combine through the emulated domain names, so those names must resolve to the Combine Load Balancers. For how Combine uses Route 53 Private Hosted Zones for this, see [VPC Network Architecture](../../start-here/7-network-architecture/1-vpc-network-architecture.md).

Create a Route 53 Private Hosted Zone for `c2s.ic.gov` and associate it with your VPC. In it, add CNAME records that point to the Endpoint Server's Load Balancer (`combine-endpoints-service`):

- `*.c2s.ic.gov`
- `*.us-iso-east-1.c2s.ic.gov`
- `*.us-iso-west-1.c2s.ic.gov`
- `*.eks.c2s.ic.gov`
- `*.es.c2s.ic.gov`

To reach TAP by its emulated name, create a Private Hosted Zone for `cia.ic.gov`. In it, add a CNAME record for `cap.cia.ic.gov` that points to the TAP Server's Load Balancer (`combine-tap-service`).

These names are for the US Top Secret Partition (C2S). When you emulate the US Secret Partition (SC2S):

- Use `sc2s.sgov.gov` in place of `c2s.ic.gov`.
- Use the `us-isob-east-1` and `us-isob-west-1` Regions in place of `us-iso-east-1` and `us-iso-west-1`.
- Also add a `*.global.sc2s.sgov.gov` record.
- Use `geoaxis.nga.smil.mil` as the TAP host name in place of `cap.cia.ic.gov`.

## Step 8: Test the Deployment

Confirm that the Endpoint Server and the TAP Server respond. First, use `kubectl` or the AWS Console to find the Load Balancer addresses for the TAP Server and the Endpoint Server:

```bash
# login to cluster
aws eks update-kubeconfig --region us-east-1 --name CLUSTER_NAME

# get services
kubectl get svc -n combine
```

### Test the Endpoint Server

From a test instance inside the Combine VPC, run `aws sts get-caller-identity`. Then check that you can follow the request in the Endpoint Server's logs. For how to configure a client inside Combine, see [Orientation](../../start-here/5-orientation.md).

### Test the TAP Server

In a browser, check that the TAP Server returns a response.