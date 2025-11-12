---
sidebar_position: 5
title: Orientation
---

# Orientation

Now that you have been onboarding to your Combine environment there are a couple of additional things to be aware of.

# AWS API - Certificate Authority Trust

# AWS API - Rewriting

Combine will require that valid production environment specfic values are present in AWS API Calls.

For example, Combine will reject an AWS CLI call such as:

`aws ec2 describe-availability-zones --filters Name=region-name,Values=us-east-1`

that uses the commercial Region ID value. Combine would expect that Region ID to match the production environment. For example, for the AWS Top Secret Regions, Combine would expect that call to be made like this:

`aws ec2 describe-availability-zones --filters Name=region-name,Values=us-iso-east-1`

_NOTE: The `us-iso-east-1` in place of the `us-east-1`_

This is also true for the Partition ID within ARN Values. For example, Combine will reject an arn formatted like this:

`arn:aws:...`

and would expect all ARN Values to use the Partition ID that matches the production environment. For example, for the AWS Top Secret Regions, Combine would expect that an ARN Value formatted like this:

`arn:aws-iso:...`


# What IS NOT part of the Emulation?

### Default Subnets

If you elected to have default subnets created when Combine was deployed then you will see subnets prefixed with `Combine-AZ-`. These were created by default for your convenience. These are generally _not_ provided by default by the production environment's sponsor, however they can usually be created yourself or requested prior to your production deployment.

### `WLDEVELOPER` EC2 Role

In Combine accounts that are implementing a production environment which uses the `WLDEVELOPER` series of enterprise IAM Roles there is a `<prefix>-WLDEVELOPER-EC2` role. This is created by default for convenience.

This is not generally _not_ provided by default by the production environment's sponsor, however it can generally be requested prior to your production deployment.

# What IS part of the Emulation?

_Under development._

# What can you use/change?

_Under development._

# What can you NOT use/change?

### `RESTRICTED_` Subnets

Please do not attempt to create any resources inside a Subnet prefixed by `RESTRICTED_`. Those subnets are reserved for Combine's internal resources. They are not within the AirGap Layer.
