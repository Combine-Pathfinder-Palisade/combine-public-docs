# Kubernetes Proxy Access Control

You can configure the Combine Kubernetes Proxy to allow or deny requests based on the source IP address (an individual IP address or a CIDR block) or the IAM Role ARN that signed the request. For guidance on using AWS EKS with Combine, see [Combine EKS Support](../9-troubleshooting-eks/1-guidance.md).

## Configuration

Set these Configuration Values in the Combine Configuration table (the `combine-configuration` DynamoDB table). See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.

| Configuration Value | Default | Description |
|---|---|---|
| `combine.endpoints.kubernetes.proxy` | `true` | Enables or disables the Combine Kubernetes Proxy globally. |
| `combine.endpoints.kubernetes.proxy.ip` | _(empty)_ | Space-separated IP addresses. Allows Kubernetes Proxy requests only from these source IP addresses. |
| `combine.endpoints.kubernetes.proxy.ip.except` | _(empty)_ | Space-separated IP addresses. Allows requests from all source IP addresses except these. |
| `combine.endpoints.kubernetes.proxy.cidr` | _(empty)_ | Space-separated CIDR blocks. Allows Kubernetes Proxy requests only from these source IP ranges. |
| `combine.endpoints.kubernetes.proxy.cidr.except` | _(empty)_ | Space-separated CIDR blocks. Allows requests from all source IP addresses except these CIDR ranges. |
| `combine.endpoints.kubernetes.proxy.roleArn` | _(empty)_ | Space-separated Role ARNs or Role ARN fragments. Allows Kubernetes Proxy requests only from these Role ARNs. |
| `combine.endpoints.kubernetes.proxy.roleArn.except` | _(empty)_ | Space-separated Role ARNs or Role ARN fragments. Allows requests from all Role ARNs except these. |

A Role ARN matches if it contains one of the configured values (for example, an IAM Role Name).

## How Conditions Combine

You can combine IP address, CIDR block, and Role ARN conditions:

- A request that matches any `.except` value is not proxied.
- If one or more allow lists are configured, a request is proxied when it matches at least one of them.
