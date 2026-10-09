# Lambda Host VPC

Due to certain security requirements some Combine Deployments require every Lambda Function to be attached to a VPC. Combine supporst this via the `Lambda Host VPC` feature which attaches the Lambda Functions of the Combine CloudFormation Stack (`combine.yaml`) to Subnets with a Security Group in a VPC that you provide. 

Lambda Host VPC is available in Combine 3.14.8 and later.

## Lambda Functions It Attaches

Each function name gains a `<ShardId>_` element after `Combine_` when you set a Shard ID.

| Lambda Function | Region | Purpose | AWS endpoints it calls |
|---|---|---|---|
| `Combine_CFN_CF_Configuration_Value` | Master Region | Backs the CloudFormation Custom Resources that write Combine Configuration Values. | DynamoDB, and the CloudFormation response bucket (S3) |
| `Combine_CFN_CF_Configure_Combine_Firewall` | Every Region | Backs the CloudFormation Custom Resource that routes Combine VPC traffic through the Combine Firewall. | EC2, and the CloudFormation response bucket (S3) |
| `Combine_CFN_CF_Configure_Combine_Firewall_Rule_Group` | Every Region | Backs the CloudFormation Custom Resource that creates the Combine Firewall override Rule Group. | Network Firewall, and the CloudFormation response bucket (S3) |
| `Combine_Alerts_Event_Ingest` | Master Region | Stores Alert Events. | DynamoDB |
| `Combine_Alerts_Event_Listener_Firewall` | Every Region | Turns Combine Firewall alerts into Alert Events. | SNS **in the Master Region** |

The Combine Environment Health Check Lambda Function (`Combine_Environment_Health_Check_VPC_<VpcName>`) is not affected. It is always attached to the Combine VPC, because it checks the emulated endpoints through the Combine VPC's DNS.

## Requirements

### Lambda Host VPC

The Lambda Host VPC should be in the same AWS Account / AWS Region as the Combine Deployment.

It should have a Subnet in at least two Availability Zones.

It should have a Security Group that allows outbound TCP 443 to the AWS Endpoints (or alternatively allow outbound traffic to your HTTP Proxy's Port).

### Network Access

Each Lambda Function must be able to reach the following AWS Endpoints:

- DynamoDB
- EC2
- S3
- SNS
- Network Firewall

This will require one of the following:

- NAT Gateway
- [Outbound HTTP Pproxy](#http-proxy)
- VPC Endpoints
	- Gateway Endpoints:
		- DynamoDB 
		- S3
	- Interface Endpoints with Private DNS Enabled:
		- EC2 (`com.amazonaws.<region>.ec2`)
		- Network Firewall (`com.amazonaws.<region>.network-firewall`)
		- SNS (`com.amazonaws.<region>.sns`)

Also confirm network access to the following:

- **CloudFormation Bucket.** The `CFN_CF` Lambda Functions report their result to CloudFormation by uploading it to a Presigned URL in the CloudFormation S3 Bucket owned by AWS (`cloudformation-custom-resource-response-<region>`). If you use an S3 Gateway Endpoint, then ensure the Endpoint Policy must allows `s3:PutObject` to that bucket. If the upload fails, the Stack does not immediately fail right away. It idles until the Custom Resource time out (one hour).
- **Additional Regions.** If you have deployed a multiple Region Combine Deployment: `Combine_Alerts_Event_Listener_Firewall` publishes to an SNS Topic in the Master Region. An SNS Interface Endpoint in an additional Region does not reach the Master Region's SNS Topic, so the Subnets there need another path to it, such as a NAT Gateway or an Outbound HTTP Proxy. The Alert Events from that Region's Combine Firewall are lost otherwise.

## CloudFormation Parameters

These CloudFormation Parameters are in the Combine CloudFormation Template (`combine.yaml`). Set them on the Combine CloudFormation Stack of each Region, for example in `clients.json` under `combineStackParameters` (see [Reference - clients.json](../../tutorials/operations-self-service-deployment/reference-clients-json.md)).

| Parameter | Default | Description |
|---|---|---|
| `LambdaHostVpc` | `false` | Set to `true` to attach the Lambda Functions to the Subnets and Security Group below. |
| `LambdaHostVpcSecurityGroupId` | (blank) | Required when `LambdaHostVpc` is `true`. The ID of the Security Group in the Lambda Host VPC. |
| `LambdaHostVpcSubnetIdA` | (blank) | Required when `LambdaHostVpc` is `true`. The ID of a Subnet in the Lambda Host VPC. |
| `LambdaHostVpcSubnetIdB` | (blank) | Required when `LambdaHostVpc` is `true`. The ID of a Subnet in the Lambda Host VPC. (Different than above.) |
| `LambdaHostVpcProxy` | `false` | Set to `true` to send outbound HTTPS traffic through an Outbound HTTP Proxy. Only applies when `LambdaHostVpc` is `true`. |
| `LambdaHostVpcProxyHost` | (blank) | Required when `LambdaHostVpcProxy` is `true`. The host name or IP address of the HTTP proxy. |
| `LambdaHostVpcProxyPort` | (blank) | Required when `LambdaHostVpcProxy` is `true`. The port of the HTTP proxy. |
| `LambdaHostVpcProxyNoProxyHosts` | (blank) | Comma delimited list of host names and domain suffixes (for example, `.amazonaws.com`) that bypass the HTTP proxy. `localhost` and `127.0.0.1` always bypass it. |

## HTTP Proxy

When `LambdaHostVpcProxy` is `true`, Combine sets a pair of Environment Variables on each Lambda Function:

- `HTTPS_PROXY` to `http://<LambdaHostVpcProxyHost>:<LambdaHostVpcProxyPort>`.
- `NO_PROXY` to `localhost,127.0.0.1` followed by `LambdaHostVpcProxyNoProxyHosts`.

The HTTP proxy must allow HTTPS (`CONNECT`) tunnels to the AWS endpoints in the table above, including the CloudFormation response bucket. Allowing `*.amazonaws.com` covers all of them. If some Services are reached through VPC Endpoints instead, list their host names in `LambdaHostVpcProxyNoProxyHosts`.

The HTTP proxy option has the following limits:

- Combine connects to the proxy with plain HTTP. HTTPS traffic stays encrypted end to end inside the tunnel. A proxy that requires a TLS connection to the proxy itself is not supported.
- The proxy must not inspect (decrypt) TLS traffic to the AWS endpoints. The Lambda Functions do not trust a TLS inspection certificate.
- Proxy Authentication is not supported.

## Inactive Lambda Functions

If a Lambda Function attached to a VPC is not invoked for 14 days, Lambda reclaims its Network Interfaces and marks it `Inactive`. The next invocation fails, and Lambda recreates the Network Interfaces, which can take several minutes. The three `CFN_CF` Lambda Functions only run during CloudFormation stack operations, so they are usually `Inactive`.

The Combine Automation Tool Commands `build`, `build_region`, `build_vpc_only`, and `upgrade` wake any `Inactive` Combine Lambda Function and wait for it to become `Active` before they change a stack.

If you change or delete a Combine CloudFormation Stack another way (for example, in the AWS Console or with `destroy`), the operation can fail because a Custom Resource's Lambda Function was `Inactive`. Wait until the Lambda Function is `Active`, then retry the operation:

```bash
aws lambda get-function-configuration --function-name Combine_CFN_CF_Configuration_Value --query State
```

## Turning It Off

Set `LambdaHostVpc` to `false` and update the Combine CloudFormation Stack. Check in the Lambda console that each Lambda Function no longer lists a VPC. Lambda can take up to 20 minutes to delete the Network Interfaces, so keep the Subnets and Security Group until it has.
