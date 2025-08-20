---
sidebar_position: 5
title: Known Issues

---

# Known Issues

- Versions `2.30.x` and above of the AWS CLI began to send a Header with either a CRC, CRC32 or SHA256 checksum. Combine Version `3.13.7` introduced a fix for this.

- Some versions of the TerraForm AWS Provider will not create an Application Load Balancers because it always sends a value for the Desync Mitigation Mode attribute. Since Desync Mitigation Mode is not supported on the high side these calls always fail.

# Known Limitations

### IMDS

Combine cannot directly intercept the link local network traffic to the AWS EC2 IMDS service. This means that if your workload tries to read the Region or Partition ID from the EC2 IMDS service, it will not receive an emulated value from Combine.

Recommended Solutions:

- Use a configuration value in your application as shim to avoid using the EC2 IMDS service. (You can also consider using the `AWS_EC2_METADATA_DISABLED` environment variable to limit access to the ECS IMDS service.)
- The Combine Team has developed an EC2 IMDS Proxy service that can be installed locally on a Server or as a pod in an EKS Cluster. In most cases this will require you to set the `AWS_EC2_METADATA_SERVICE_ENDPOINT` environment variable to override the default EC2 IMDS service and use the Combine EC2 IMDS Proxy service instead.

### Authentication via `sts:GetCallerIdentity`

There are some cases where a presigned `sts:GetCallerIdentity` is used to authenticate a client to a server within your workload. The client sends a presigned `sts:GetCallerIdentity` which is replayed by the server to confirm the identity of the client.

Due to the fundamental design of the AWS SigV4 signing algorithm, Combine cannot reliably derive and replay the credentials used to presign the `sts:GetCallerIdentity` call except in the following cases:

- The credentials used where issued by the CAP/SCAP service emulated in Combine.
- The credentials used where issued by a call to `sts:AssumeRole` or `sts:AssumeRoleWithWebIdentity` that occurred within Combine.
- The credentials used where from an IAM User that was registered for use by Combine in Secrets Manager (very very rare).

In all other cases (_such as credentials issued by an EC2 Instance Profile_) Combine cannot replay the credentials causing the Authentication to break.

Recommended Solution:

- The Combine Team recommends that for generating the presigned `sts:GetCallerIdentity` call (and for that only) that you use the non-emulated region value. Combine will detect the use of a non-emulated credential for that call and will pass it on without attempting to resign the call.
