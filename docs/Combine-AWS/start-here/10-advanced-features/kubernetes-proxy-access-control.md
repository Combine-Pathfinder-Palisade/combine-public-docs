# Kubernetes Proxy Access Control

The Combine Kubernetes Proxy can be configured to allow or deny requests based on the source IP address (CIDR block) or the IAM Role ARN used to sign the request.

## Enabling and Disabling the Kubernetes Proxy

The Kubernetes Proxy can be toggled globally:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.kubernetes.proxy` | `true` / `false` | Enable or disable the Combine Kubernetes Proxy globally |

## Filtering by Source IP (CIDR Block)

You can restrict Kubernetes Proxy access to specific CIDR blocks of source IP addresses:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.kubernetes.proxy.ip` | Comma-separated CIDR blocks | Allow Kubernetes Proxy requests only from these source IP ranges |
| `combine.endpoints.kubernetes.proxy.ip.except` | Comma-separated CIDR blocks | Allow requests from all source IPs except these CIDR ranges |

## Filtering by Role ARN

You can restrict Kubernetes Proxy access to requests signed by specific IAM Role ARNs:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.kubernetes.proxy.roleArn` | Comma-separated Role ARNs | Allow Kubernetes Proxy requests only from these Role ARNs |
| `combine.endpoints.kubernetes.proxy.roleArn.except` | Comma-separated Role ARNs | Allow requests from all Role ARNs except these |

Multiple allow conditions (IP and Role ARN) can be combined — a request must satisfy all configured conditions to be proxied.

## Setting Configuration Values

All configuration values above are set in the Combine Configuration DynamoDB table (`combine-configuration`). See [Edit Combine Configuration Values](../../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.
