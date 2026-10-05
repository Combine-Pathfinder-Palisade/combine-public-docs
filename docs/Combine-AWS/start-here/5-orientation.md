---
sidebar_position: 5
title: Orientation
---

# Orientation

After you complete the [Onboarding Guide](4-orientation-onboarding-guide.md), there are a few more things to be aware of: how to trust Combine's Certificate Authority, how Combine rewrites AWS API calls, and which parts of your environment are part of the emulation.

## AWS API - Certificate Authority Trust

Before you can call an AWS API Endpoint, you must configure Combine's private Certificate Authority in your trust chain. The process varies with your server tooling and server operating system.

To quickly test this with the AWS CLI, set a temporary environment variable:

```bash
export AWS_CA_BUNDLE=<path to ca-chain.cert.pem>
```

The `ca-chain.cert.pem` file is at `certificates/ca-chain.cert.pem` in your Credential Package.

You can then run AWS CLI commands against the emulated AWS API Endpoints to confirm that your network configuration is healthy.

## AWS API - Rewriting

Combine requires AWS API calls to contain values that are valid in your production environment.

For example, Combine rejects this AWS CLI call because it uses a commercial Region ID:

```bash
aws ec2 describe-availability-zones --filters Name=region-name,Values=us-east-1
```

Combine expects the Region ID to match your production environment. For the US Top Secret Partition (C2S), make the call with `us-iso-east-1` in place of `us-east-1`:

```bash
aws ec2 describe-availability-zones --filters Name=region-name,Values=us-iso-east-1
```

The same applies to the Partition ID in ARN values. Combine rejects an ARN formatted like `arn:aws:...` and expects every ARN to use the Partition ID of your production environment. For the US Top Secret Partition (C2S), Combine expects an ARN formatted like `arn:aws-iso:...`.

### Rewriting

Combine supports these production environment values by acting as a proxy for AWS API calls. The calls you make to the emulated AWS API Endpoints are routed to an Endpoint Server, which then makes _a new call_ to the AWS API Endpoint in the host Region. During this proxy transaction, Combine alters values in the AWS API call:

- In the request, Combine changes emulated values to host Region values.
- In the response, Combine changes host Region values back to emulated values.

A client inside Combine sees only emulated values, so it appears to be operating in the emulated Region and Partition. Behind the scenes, Combine rewrites each call before it reaches the host Region and Partition.

This has a few side effects:

- The AWS Console is outside the Combine emulation, so it shows host Region and Partition values as normal. If you see an emulated value in the AWS Console, an emulated value might have been sent to the host Region or Partition unintentionally. Report it to the Combine Support Team for investigation.
- Because AWS API calls use Request Signatures, Combine cannot forward the AWS API call it received (the "client" call). Instead, it sends a new AWS API call (the "proxy" call) to the host Region or Partition. This itself has two side effects:
    - Combine must _infer_ the credentials to sign the proxy call with. This process is complicated but works for most common cases. If Combine cannot infer the credentials, it uses a default role instead, which can change the "caller identity".
    - Combine sends the proxy call from the Endpoint Servers, not from the original client server, so the source IP address of the traffic differs.

#### Credential Inference

Combine can predictably infer the AWS credentials used to sign an AWS API call in the following situations:

- The credentials were issued through a CAP/SCAP service provided by Combine.
- The credentials were issued to an IAM User that is registered in the Combine system. This is rare; see [IAM User Credential Lookup](10-advanced-features/iam-user-credential-lookup.md).
- The credentials were issued by an `sts:AssumeRole` or `sts:AssumeRoleWithWebIdentity` AWS API call made within Combine.
- The credentials were issued by an `sts:AssumeRoleWithSAML`, `sts:GetFederationToken`, `sts:GetSessionToken`, or `sts:AssumeRoot` AWS API call made within Combine. (Supported as of Combine 3.14.2.)
- The credentials were issued by an EC2 Instance Profile that meets both of these conditions:
    - The client server's private IP address is visible in the HTTP request and is unique in the AWS Account.
    - The EC2 Instance Profile's role has a trust policy that also allows Combine to assume the role. If your Combine environment allows IAM Role creation, Combine automatically injects this trust policy through Rewriting when the role is created. Combine masks the injected trust policy so that tools such as TerraForm do not end up with invalid state.
- The credentials were issued to a Lambda Function attached to a VPC that meets both of these conditions:
    - The private IP address of the request belongs to the Lambda Function's Network Interface, and no other Lambda Function in the AWS Account uses the same VPC Subnet and set of Security Groups.
    - The Lambda Function's execution role has a trust policy that also allows Combine to assume the role (see the EC2 Instance Profile conditions above).

For more on how Combine uses the IAM Role of an EC2 Instance or Lambda Function, see [Resource Role Masquerade](10-advanced-features/resource-role-masquerade.md).

If none of these conditions are met, Combine signs the proxy call with the default role. This can change the "caller identity" from the client's perspective. To choose a different default role, see [Change the Default Role](../tutorials/operations-self-service-deployment/how-to-change-default-role.md).

## What Is Part of the Emulation?

Restrictions in Combine fall into three broad categories:

- Restrictions that represent physical constraints. These cannot be changed.
- Restrictions that represent your production environment sponsor's policy constraints. These can be changed if you have an exception from your production environment's sponsor.
- Restrictions that protect the Combine emulation.

### Production Environment Sponsor Restrictions

Your exact configuration varies with your production environment's sponsor. Most sponsors commonly do _not_ allow you to:

- Create IAM resources, such as an IAM Policy, IAM User, IAM User Group, or IAM Role
- Create a VPC
- Create a VPC interconnect, such as a Transit Gateway or VPC Peering Connection

With a few exceptions, you are generally _allowed_ to:

- Create a VPC Subnet
- Create a VPC Subnet Route Table
- Create a VPC Security Group (although at least one sponsor prohibits this)
- Assign an existing EC2 Instance Profile to a server
- Take any other AWS API action that is not otherwise prohibited

### Emulation Protection Restrictions

By default, Combine limits a few actions to protect the emulation itself or to prevent you from accidentally stepping outside the emulation:

- Combine blocks all AWS API actions in every Region except the Regions that host Combine.
- Combine prevents you from creating a Lambda Function outside a VPC. Such a function would be outside the AirGap Layer and unable to reach the emulated Endpoints. The Combine Support Team can work with you to lift this restriction.
- Combine prevents you from creating a VPC Endpoint for an AWS Service that uses a Security Group, because a Security Group that excludes the Combine servers can halt the emulation. This restriction was added in Combine 3.14, and the Combine Support Team can work with you to lift it.

## What Is Not Part of the Emulation?

### Default Subnets

If you chose to have default subnets created when Combine was deployed, you see subnets whose Name Tag follows the pattern `<ShardId>-<VPC Name>-AZ-` (for example, `Combine-AZ-A1`), or `<ShardId>-<VPC Name>-Public-AZ-` for default public subnets. Combine creates these for your convenience. Production environment sponsors generally do _not_ provide them by default, but you can usually create them yourself or request them before your production deployment.

### `WLDEVELOPER` EC2 Role

If your production environment uses the `WLDEVELOPER` series of enterprise IAM Roles, your Combine account has a `<prefix>-WLDEVELOPER-EC2` role (for example, `Combine-TS-WLDEVELOPER-EC2`). Combine creates it by default for your convenience.

Production environment sponsors generally do _not_ provide this role by default, but you can generally request it before your production deployment.

### `KEYMANAGER` Role

Combine creates `KEYMANAGER` user roles for C2S and SC2S (for example, `Combine-TS-KEYMANAGER` and `Combine-S-KEYMANAGER`) to mirror the production environment's separation of KMS key administration from general development. Use `KEYMANAGER` to create keys, change key policies, manage grants, or schedule key deletion. Its default policy does not allow general workload operations or KMS encryption and decryption.

Use `WLDEVELOPER` for all other workload and infrastructure operations. Its default policy allows use of existing KMS keys, including encryption and decryption, and grants for AWS resources, but not key creation or policy changes.

## What Can You Use/Change?

_Under development._

## What Can You Not Use/Change?

### `RESTRICTED-` Subnets

Do not create any resources in a subnet prefixed with `RESTRICTED-`. These subnets are reserved for Combine's internal resources and are not within the AirGap Layer. Combine's Emulation Protection policy denies launching an EC2 Instance into them.
