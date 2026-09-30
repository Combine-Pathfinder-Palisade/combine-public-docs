---
sidebar_position: 8
title: Troubleshooting
---

# Troubleshooting

If you experience unexpected behavior in Combine, start with these checks:

- **Check the TAP Dashboard for Alert Events** (formerly Violations). Combine attempts to proactively report any issue it encounters with a request as an Alert Event. Combine 3.13.10 added many new Alert Events to help with troubleshooting.
- **Look for HTTP 501 (Not Implemented) responses.** In most cases where Combine blocks an unsupported Service or Service feature, it returns an HTTP 501 status code. Starting in Combine 3.13.10, Combine also returns JSON or XML error messages, even when they do not match normal AWS API behavior, to speed up troubleshooting.
- **Review the known issues.** See [Known Issues](6-known-issues.md) for current issues and limitations.

For deeper investigation, see [View Combine Logs](../tutorials/operations/how-to-view-combine-logs.md). If you still need help, contact the Combine Support Team.

## Pitfalls

Combine restricts your workload to the emulated Endpoints, but Combine itself needs unimpeded access to AWS Services to function. These common issues can cause Combine to malfunction, and can even prevent Combine from warning you that this has happened:

- **VPC Endpoints with a restrictive Security Group.** Do not create PrivateLink VPC Endpoints for AWS Services with a Security Group that excludes access from the Combine servers. The Combine Team can help determine which Security Group rules you need. As of Combine 3.14, Combine by default blocks creating a VPC Endpoint for an AWS Service that uses a Security Group (see [Emulation Protection Restrictions](5-orientation.md#emulation-protection-restrictions)).
- **EKS Security Groups.** The EKS Security Group must also allow access from the Combine servers, as described in [Troubleshooting - EKS Guidance](9-troubleshooting-eks/1-guidance.md).
