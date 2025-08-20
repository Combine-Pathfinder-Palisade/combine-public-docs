---
sidebar_position: 3
title: Architecture / Networking
---

# Architecture

## VPC Overview

## Access

# What IS NOT part of the Emulation?

## Default Subnets

If you elected to have default subnets created then you will see subnets prefixed with `Combine-AZ-`. These were created by default for your convenience. These are not generally provided by default by the production environment';s sponsor but can usually be created yourself or requested prior to production deployment.

## `WLDEVELOPER` EC2 Role

In many Combine deployments there is a `<prefix>-WLDEVELOPER-EC2` role. This is created by default for convenience. This is not generally provided by default by the production environment's sponsor but can usually be requested prior to production deployment.

# What IS part of the Emulation?

# What can you use/change?

# What can you NOT use/change?

## `RESTRICTED_` Subnets

Please do not attempt to create any resources inside the subnets with the `RESTRICTED_` prefix. Those subnets are reserved for Combine resources and are generally not within the AirGap Emulation.

# Combine VPC Diagram

![Combine VPC Resource Map](/aws/vpc-resource-map.png)
