# How to configure Combine on EKS (with helm!)

:::tip[🚧 Work in Progress 🚧 ]

Please note that this tutorial may change as we are working for a seamless tutorial!

:::

_Note that the Combine team must allow your aws account id to access our ECR registries where the images are stored._

This guide walks you through installing **Combine** via our Helm repository, then enabling CloudWatch Container Insights / Fluent Bit logging.

Some things to be aware of:
- These instructions are tailored for use with an EKS cluster created with EKS Auto mode; the vpc cni, coredns and kube-proxy are managed by AWS and will not show up in the cluster.
- The region in the snippets below is assumed to be `us-east-1`. This region is the region that your Combine deployment is hosted in, and not a high side region.
- You'll need the name of the cluster before you create it, as tags containing the cluster's name need to be present before the cluster is created.

---

## 1. Add OIDC Provider of cluster as an Identity Provider in IAM

- with audience `sts.amazonaws.com`

## 1.5 Ensure the subnets that the cluster will use have the following tags:

For the endpoints service load balancer (which is default internal to the VPC):
```
kubernetes.io/role/internal-elb: 1
kubernetes.io/cluster/CLUSTER_NAME: owned
```

For the TAP service load balancer (which is default open to the public internet):
```
kubernetes.io/role/elb: 1
kubernetes.io/cluster/CLUSTER_NAME: owned
```

## 2. Create the appropriate roles for Combine Service Accounts

You can name them `combine-endpoints-irsa-role` and `combine-tap-irsa-role`, respectively. In the trust policies below, replace `YOUR_OIDC_ID` with your cluster's OIDC provider ID and `COMBINE_NAMESPACE` with the namespace you install Combine into (`combine` in step 5).

The S3 bucket in the policies below is the Combine DevOps bucket, `combine-devops-ACCOUNT_NUMBER-us-east-1`. If you have a sharded (namespaced) Combine Deployment, it is named `combine-SHARD_ID-devops-ACCOUNT_NUMBER-us-east-1` (with the Shard ID in lowercase) instead.

The Endpoints IRSA role must have the following permissions and trust:

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

The TAP IRSA role must have the following permissions and trust:

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



## 3. Log in your Helm client to our ECR registry

Note that you will be logging into the Combine team's ECR, so the account number here will be different than above.

```
aws ecr get-login-password --region us-east-1 \
  | helm registry login --username AWS --password-stdin \
    COMBINE_TEAM_ACCOUNT_NUMBER.dkr.ecr.us-east-1.amazonaws.com
```

## 4. Install CloudWatch Observability

Beware, you might have to add an IAM Access Entry to the cluster (or another access method, perhaps ConfigMap) to be able to kubectl to the cluster.

```
helm repo add aws-observability https://aws-observability.github.io/helm-charts
helm repo update
helm upgrade --install amazon-cloudwatch \
  aws-observability/amazon-cloudwatch-observability \
  -n amazon-cloudwatch --create-namespace \
  -f cloudwatch-helm-values.yaml
```

The contents of the `cloudwatch-helm-values.yaml`:

<details>
  <summary>CloudWatch Helm values</summary>

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

## 5. Install Combine

```
helm upgrade --install combine \
  oci://COMBINE_TEAM_ACCOUNT_NUMBER.dkr.ecr.us-east-1.amazonaws.com/combine \
  -n combine --create-namespace \
  -f combine-helm-values.yaml \
  --set tap.serviceAccount.roleArn=arn:aws:iam::ACCOUNT_NUMBER:role/combine-tap-irsa-role \
  --set endpoints.serviceAccount.roleArn=arn:aws:iam::ACCOUNT_NUMBER:role/combine-endpoints-irsa-role
```

The contents of `combine-helm-values.yaml` (if you have a sharded Combine Deployment, use `combine-SHARD_ID-devops-ACCOUNT_NUMBER-us-east-1` and `combine-SHARD_ID-configuration`, with the Shard ID in lowercase):

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

Then, wait for combine pods to show healthy...

## 6. Add DNS records in Route 53 to map C2S domains to Combine's load balancers

Create a Route 53 private hosted zone for `c2s.ic.gov`, associate it with your VPC, and add CNAME records that point to the Endpoints service's load balancer (`combine-endpoints-service`):

- `*.c2s.ic.gov`
- `*.us-iso-east-1.c2s.ic.gov`
- `*.us-iso-west-1.c2s.ic.gov`
- `*.eks.c2s.ic.gov`
- `*.es.c2s.ic.gov`

To reach TAP by its emulated name, create a private hosted zone for `cia.ic.gov` with a CNAME record `cap.cia.ic.gov` that points to the TAP service's load balancer (`combine-tap-service`).

When emulating SC2S, use `sc2s.sgov.gov` with the `us-isob-east-1` and `us-isob-west-1` Regions, add `*.global.sc2s.sgov.gov`, and use `geoaxis.nga.smil.mil` for TAP.

## 7. Test!

Use `kubectl` or the console to get the load balancer endpoints for TAP and endpoints servers:

```bash
# login to cluster
aws eks update-kubeconfig --region us-east-1 --name CLUSTER_NAME

# get services
kubectl get svc -n combine
```

#### For testing Endpoints
From a test box within the Combine VPC, try running an `aws sts get-caller-identity` and see if you can follow the logs.

#### For testing TAP
See if you can get a response back from the tap server in the browser.