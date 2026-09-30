---
sidebar_position: 1
title: Welcome to Combine
---

# What Is Combine?

Combine for AWS is an emulation environment where you build, test, and deploy your cloud workload as if it were running in your production environment.

Software written for the commercial cloud Partitions typically does not work in the secure cloud Partitions of your production environment. Combine solves this problem with an emulated environment that acts as a sandbox for validating your software.

The TAP Dashboard reports any action your software takes that would prevent it from working in your production environment.

## What Combine Emulates

Combine emulates four primary differences between the commercial cloud and your production environment:

1. **Access Control** - Combine emulates the access control solution that your production environment uses to regulate IAM interactions.
2. **Service Parity** - Combine limits your software to the AWS API calls that are also available in your production environment.
3. **AirGap Networking** - Combine limits your software's ability to make egress network calls.
4. **Endpoints** - Combine provides AWS API Endpoints that match those in your production environment. This includes requiring an emulated private Certificate Authority chain and production environment AWS API values, such as the Region ID and Partition ID.

## Next Steps

- To prepare for a new Combine Deployment, see [Before Deployment](2-before-deployment.md).
- To get access to an existing Combine Deployment, see the [Onboarding Guide](4-orientation-onboarding-guide.md).
- To learn how Combine rewrites AWS API calls and what is part of the emulation, see [Orientation](5-orientation.md).
- To review current limitations, see [Known Issues](6-known-issues.md).
