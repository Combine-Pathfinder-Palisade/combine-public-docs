---
sidebar_position: 8
title: Troubleshooting
---

# Troubleshooting

If you are experiencing unexpected behavior in Combine here are several tips to help you troubleshoot:

- Consult your TAP Dashboard for Alert Events (formerly Violations). Combine will attempt to proactively report any issues it is encounters with a request through the Alert Events interface. (For long time Combine customers, starting in Combine Version 3.13.10 many many new Alert Events were added to help troubleshooting.)

- Combine will return a 501 (Not Implemented) HTTP Code in most cases where it is blocking an unsupported Service or Service Feature. (For long time Combine customers, starting in Combine Version 3.13.10 Comboine has also started returning JSON/XML error messages even if it does not match the normal AWS API behavior. This was done to accelerate troubleshooting.)

## Pitfalls

While Combine enforces access to AWS Services only through emulated Endpoints, it must have unimpeded access to AWS Services to function. There are several common issues that can cause Combine to malfunction (and even eliminate our ability to warn that this has happened):

- Do not create VPC PrivateLink Endpoints for AWS Services with a security group that excludes Combine server access. The Combine Team can help determine what security group rules are needed.

- As noted on the [Troubleshooting - EKS](/Combine-AWS/start-here/troubleshooting-eks) page the EKS Security Group will have to allow Combine server access as well.
