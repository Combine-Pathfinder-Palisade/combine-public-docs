---
sidebar_position: 5
title: Known Issues

---

# Pitfalls

While Combine enforces access to AWS Services only through emulated Endpoints, it must have unimpeded access to AWS Services to function. There are several common issues that can cause Combnie to malfunction (and even eliminate our ability to warn that this has happened):

(1) Do not create VPC PrivateLink Endpoints for AWS Services with a security group that excludes Combine server access. The Combine Team can help determine what security group rules are needed.

(2) As noted on the [Troubleshooting - EKS](/Combine-AWS/start-here/troubleshooting-eks) page the EKS Security Group will have to allow Combine server access as well.

# Known Limitations

### IMDS

Combine cannot directly intercept the link local network traffic to the AWS EC2 IMDS service. This means that if your workload tries to read the Region or Partition ID from the EC2 IMDS service, it will not receive an emulated value from Combine.

Recommended Solutions:

(1) Use a configuration value in your application as shim to avoid using the EC2 IMDS service. (You can also consider using the `AWS_EC2_METADATA_DISABLED` environment variable to limit access to the ECS IMDS service.)

(2) The Combine Team has developed an EC2 IMDS Proxy service that can be installed locally on a Server or as a pod in an EKS Cluster. In most cases this will require you to set the `AWS_EC2_METADATA_SERVICE_ENDPOINT` environment variable to override the default EC2 IMDS service and use the Combine EC2 IMDS Proxy service instead.

### Authentication via `sts:GetCallerIdentity`

There are some cases where a presigned `sts:GetCallerIdentity` is used to authenticate a client to a server. The client sends a presigned `sts:GetCallerIdentity` which is replayed by the server to confirm the identity of the client.

Due to the fundamental design of the AWS SigV4 signing algorithm, Combine cannot reliably derive and replay the credentials used to presign the `sts:GetCallerIdentity` call except in the following cases:

(1) The credentials used where issued by the CAP/SCAP service emulated in Combine.

(2) The credentials used where issued by a call to `sts:AssumeRole` or `sts:AssumeRoleWithWebIdentity` that occurred within Combine.

(3) The credentials used where from an IAM User that was registered for use by Combine in Secrets Manager (very very rare).

In all other cases (such as credentials issued by an EC2 Instance Profile) Combine cannot replay the credentials causing the Authentication to break.

Recommended Solution:

(1) The Combine Team recommends that for generating the presigned `sts:GetCallerIdentity` call (and for that only) that you use the non-emulated region value. Combine will detect the use of a non-emulated credential for that call and will pass it on without attempting to resign the call.

# Known Issues

- Versions `2.30.x` and above of the AWS CLI began to send a Header with either a CRC, CRC32 or SHA256 checksum. Combine Version `3.13.7` introduced a fix for this.

- There is a known issue with some versions of the TerraForm AWS Provider that causes an Application Load Balancers to not create properly because it always sends a value for the Desync Mitigation Mode attribute. Since Desync Mitigation Mode is not supported on the high side these calls always fail.