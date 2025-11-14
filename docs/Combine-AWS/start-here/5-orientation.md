---
sidebar_position: 5
title: Orientation
---

# Orientation

Now that you have been onboarding to your Combine environment there are a couple of additional things to be aware of.

# AWS API - Certificate Authority Trust

Combine will require that you configure the private Certificate Authority in your Trust Chain before you can call an AWS API Endpoint. The process to do this varies based on your server tooling and server operating system.

If you would like to quickly test this using the AWS CLI you can set a temporary environment variable like this:

`export AWS_CA_BUNDLE=<path to ca-chain.cert.pem>`

This will allow you run AWS CLI commands against the emulated AWS API Endpoints to confirm your network configuration is healthy.

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

### Rewriting

You might wonder how Combine supports these production environment specific values? Combine acts as a proxy for AWS API calls. The calls that you make to the emulated AWS API Endpoints are routed to a Combine server which then makes _a new call_ to the AWS API Endpoint in the hosted region. During this proxy transaction Combine will alter the request/response values in the AWS API call. Values in the request are changed from emulated values to values for the host region. Values in the response are changed in the reverse.

From the context of a client inside Combine, all that is seen are emulated values, making it appear that you are actually operating in the emulated Region/Partition. Under the covers hwoever, these calls are rewritten before reaching the host Region/Partition.

This has a few side effects that you should be aware of:

- The AWS Console will show hosted Region/Partition values since it is outside of the Combine emulation. If you browse around your account in the AWS Console you will see only hosted Region/Partition values as normal. (In fact, if you see an emulated value it might be an indication that an emulated value has unintentionally been transmitted to the hosted Region/Partition. This should be communicated to the Combine Support Team for investigation.)
- Due to the AWS API's use of Request Signatures Combine must send a new AWS API call (the "proxy" call) to the hosted Region/Partition during the proxy transaction. It does not forward the AWS API call that it received (the "client" call.) This itself has several side effects:
    - Combine must _infer_ the credentials used to sign the proxy call. This process is complicated but works for most common cases. However, if Combine cannot infer credentials, it will use a default role instead. This can cause the "caller identity" to change in those situations.
    - Combine must send the proxy call from the Combine Endpoint servers. This means that the network traffic will originate from Combine Endpoint servers not the original client servers so the IP Address of the traffic will differ.

Combine can predictably infer the AWS Credentials used to sign an AWS API call in the following situations:

- Credentials were issued through a CAP/SCAP service provided by Combine.
- Credentials were issued via an IAM User assuming that IAM User is registered in the Combine system. (_NOTE: This is very very rare._)
- Credentials were issued via an `sts:AssumeRole` AWS API call made within Combine.
- Credentials were issued via an `sts:AssumeRoleWithWebIdentity` AWS API call made within Combine.
- Credentials were issued by an EC2 Instance Profile that meets the following conditions:
    - The client server's Private IP of the request is visible in the HTTP Request and is unique in the AWS Account.
    - The client server's EC2 Instance Profile has a trust policy that allows Combine to also assume the role. (_NOTE: If the permission to create an IAM Role is enabled in your Combine environment, then Combine will automatically inject the necessary trust policy via Rewriting at role creation time. This trust policy will be masked to prevent tools like TerraForm from having invalid state._)

If none of these conditions are met then Combine will use the default role to sign the proxy request. This can result in the "caller identity" changing from the perspective of the client.

# What IS part of the Emulation?

Restrictions in Combine fall into three broad categories:

- Restrictions that represent physical constraints. These cannot be changed.
- Restrictions that represent your production environment sponsor's policy constraints. These can be changed if you have an exception from your production environment sponsor.
- Restrictions that protect the Combine Emulation.

### Production Environment Sponsor Restrictions

While your exact configuration will vary based on your specific production environment's sponsor below are some actions that are commonly _not allowed_ across most sponsors:

- You generally cannot create IAM resources (IAM Policy, IAM User, IAM User Group, IAM Role and so forth.)
- You generally cannot create a VPC.
- You generally cannot create a VPC interconnect (Transit Gateway, VPC Peering Connection, and so forth.)

With a few exceptions, you are generally _allowed_ to take actions like:

- Create a VPC Subnet.
- Create a VPC Subnet Route Table.
- Create a VPC Security Group (although at least one sponsor prohibit this.)
- Assign an existing EC2 Instance Profile to a server.

and any other AWS API action not otherwise prohibited.

Combine limits a few actions by default in order to either protect the emulation itself or to prevent you from accidentally stepping outside the emulation:

- Combine will block all AWS API actions in any other Region except those hosting Combine.
- Combine will prevent you from creating an AWS Lambda function outside of a VPC. (This is because it would be outside the Combine AirGap and unable to reach the Combine Emulated Endpoints. This restriction can be lifted in conjunction with the Combine Support Team.)

# What IS NOT part of the Emulation?

### Default Subnets

If you elected to have default subnets created when Combine was deployed then you will see subnets prefixed with `Combine-AZ-`. These were created by default for your convenience. These are generally _not_ provided by default by the production environment's sponsor, however they can usually be created yourself or requested prior to your production deployment.

### `WLDEVELOPER` EC2 Role

In Combine accounts that are implementing a production environment which uses the `WLDEVELOPER` series of enterprise IAM Roles there is a `<prefix>-WLDEVELOPER-EC2` role. This is created by default for convenience.

This is not generally _not_ provided by default by the production environment's sponsor, however it can generally be requested prior to your production deployment.

# What can you use/change?

_Under development._

# What can you NOT use/change?

### `RESTRICTED_` Subnets

Please do not attempt to create any resources inside a Subnet prefixed by `RESTRICTED_`. Those subnets are reserved for Combine's internal resources. They are not within the AirGap Layer.