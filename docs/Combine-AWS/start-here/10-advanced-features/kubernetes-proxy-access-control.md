# Kubernetes Proxy Access Control

The Combine Kubernetes Proxy can be configured to allow or deny requests based on the source IP address (individual IP address or CIDR block) or the IAM Role ARN used to sign the request.

## Enabling and Disabling the Kubernetes Proxy

The Kubernetes Proxy can be toggled globally:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.kubernetes.proxy` | `true` / `false` | Enable or disable the Combine Kubernetes Proxy globally. Enabled by default. |

## Filtering by Source IP (CIDR Block)

You can restrict Kubernetes Proxy access to specific source IP addresses or CIDR blocks of source IP addresses:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.kubernetes.proxy.ip` | Space-separated IP addresses | Allow Kubernetes Proxy requests only from these source IP addresses |
| `combine.endpoints.kubernetes.proxy.ip.except` | Space-separated IP addresses | Allow requests from all source IPs except these IP addresses |
| `combine.endpoints.kubernetes.proxy.cidr` | Space-separated CIDR blocks | Allow Kubernetes Proxy requests only from these source IP ranges |
| `combine.endpoints.kubernetes.proxy.cidr.except` | Space-separated CIDR blocks | Allow requests from all source IPs except these CIDR ranges |

## Filtering by Role ARN

You can restrict Kubernetes Proxy access to requests signed by specific IAM Role ARNs. A Role ARN matches if it contains one of the configured values (for example, an IAM Role Name):

| Parameter Name | Value | Description |
|---|---|---|
| `combine.endpoints.kubernetes.proxy.roleArn` | Space-separated Role ARNs (or Role ARN fragments) | Allow Kubernetes Proxy requests only from these Role ARNs |
| `combine.endpoints.kubernetes.proxy.roleArn.except` | Space-separated Role ARNs (or Role ARN fragments) | Allow requests from all Role ARNs except these |

Multiple conditions (IP address, CIDR block, and Role ARN) can be combined. A request that matches any `.except` value is not proxied. If one or more allow lists are configured, a request is proxied when it matches at least one of them.

## Setting Configuration Values

All configuration values above are set in the Combine Configuration DynamoDB table (`combine-configuration`). See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.
