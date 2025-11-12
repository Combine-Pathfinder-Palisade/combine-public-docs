---
sidebar_position: 1
title: Welcome to Combine
---

# What is Combine?

Welcome to Combine for AWS! Combine is an emulation environment that allows you to build/test/deploy your cloud workload as if you were actually in your production environment.

Software written for the commercial cloud partitions will not typically function in the secure cloud partitions of your production environment. Combine overcomes this problem by providing an emulated environment that acts as a sandbox for you to validate your software.

The Combine Dashboard will report any actions from your software which would prevent it from working in your production environment.

There are four primary differences that Combine will emulate:

1. **Access Control** - Combine will emulate the same access control solution used to regulate IAM interactions that your production environment uses.
2. **Service Parity** - Combine will limit your software to only those AWS API calls that are also avaialble in your production environment.
3. **Air Gapped Networking** - Combine will limit your software's access to make egress networking calls.
4. **Endpoints** - Combine will provide AWS API Endpoints that match those from your production environment. This includes requiring the use of an emulated private certificate authority chain and AWS API values (such as Region ID, Partition ID, and so forth) from the production environment.