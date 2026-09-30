# Configure AirGap Layer

You control the behavior of the Combine AirGap Layer with CloudFormation Parameters of the `combine-vpc.yaml` template. The AirGap Layer has two Combine Firewalls, and the configuration options are the same for both:

| Firewall | Handles |
|---|---|
| Private Firewall (sometimes just called the Firewall) | Outbound traffic from private subnets. |
| Public Firewall | Outbound traffic from public subnets. |

For how the Combine Firewalls fit into the Combine VPC, see [AirGap Networking](../../../start-here/7-network-architecture/1-vpc-network-architecture.md#airgap-networking). For the other `combine-vpc.yaml` Parameters, see [Reference - clients.json](../../operations-self-service-deployment/reference-clients-json.md#combinevpcstacks-combine-vpcyaml).

## Build or Destroy a Firewall

Two Parameters control whether each Firewall is built:

| Parameter | Firewall |
|---|---|
| `CombineFirewallPrivateBuild` | Private Firewall |
| `CombineFirewallPublicBuild` | Public Firewall |

Setting either Parameter to `false` completely destroys that Firewall and its resources, and routes outbound traffic directly to the NAT Gateway or Internet Gateway (IGW).

### Public Firewall Configuration

The Public Firewall is not built by default (`CombineFirewallPublicBuild` is `false`). To place public subnets inside the AirGap Layer, set it to `true`. By default, Combine then creates an Ingress Route Table for the IGW.

If you plan to use only the Default Customer public Subnets (by setting `VpcCustomerSubnetsBuildPublic` to `true`), no additional action is needed.

If you create your own public subnets, manually create a custom Ingress Route Table and set the `IngressRouteTableOverride` Parameter to its Route Table ID. Give this Ingress Route Table a route like this for each public subnet:

| Destination | Target |
|---|---|
| `<public subnet cidr block>` | `<combine public firewall vpc endpoint id>` |

These routes send return traffic that reaches the IGW back through the Public Firewall before it returns to the originator.

## Enable or Disable the Firewalls (Dropping the AirGap Layer)

To stop routing outbound traffic through the Firewalls, set the `EnableAirgap` Parameter to `false`. The Private and Public Firewall resources stay intact, but the route table changes so outbound traffic bypasses its Firewall and routes directly to the NAT Gateway or IGW.

## Enable or Disable Permissive Mode

Permissive Mode allows all outbound traffic but still logs each outbound connection as an Alert Event on the TAP Dashboard. To turn it on, set the `EnableAirgapPermissiveMode` Parameter to `true`.

Permissive Mode applies while the Private or Public Firewall is in operation, that is, while its build Parameter and `EnableAirgap` are both `true`.

## Firewall Exception List

You can create an exception list for each Firewall. An exception list exempts individual domains from the AirGap Layer. To find traffic that the Combine Firewall blocks, see [View Combine Firewall Logs](how-to-view-combine-firewall-logs.md).

The steps below create an Auxiliary Rule Group: an AWS Network Firewall Rule Group that holds your exceptions and that you manage yourself. If this account does not already have an Auxiliary Rule Group, create one.

_NOTE: By default, Combine also builds a Combine Firewall Override Rule Group (the `CombineFirewallOverrideRuleGroupBuild` Parameter) that an `Admin` can edit from the **Firewall Rules** tool on the **Combine Tools** page of the TAP Dashboard. The Override Rule Group is separate from the Auxiliary Rule Group that these steps create._

### Exception Rule Template

Write the exceptions as a Suricata compatible rule string. Use this template for each domain suffix exception you add to the Auxiliary Rule Group:

```text
pass tls any any -> any any (msg:"White List"; flow:to_server; tls.sni; content:"<domain suffix>"; nocase; endswith; ssl_state:client_hello; sid:1001; rev:1;)
pass http any any -> any any (msg:"White List"; content:"<domain suffix>"; http_host; endswith; sid:1002; rev:1;)
```

Replace `<domain suffix>` with the suffix to exempt, for example:

- `github.com` matches all domains ending in `github.com`.
- `.combine.io` matches all subdomains of `combine.io`, but not `combine.io` itself.

Each line must have a unique `sid`. Because the Rule Group uses **Strict order**, Network Firewall evaluates the rules in the order they appear, not in order of `sid`.

### Create the Auxiliary Rule Group

1. Open the VPC Dashboard. In the left navigation pane, under **Network Firewall**, choose **Network Firewall rule groups**.
2. Choose **Create rule group**.
3. Choose **Stateful rule group**.
4. Under **Rule group format**, choose **Suricata compatible rule string**.
5. Choose **Strict order**.
6. Choose **Next**.
7. Enter a name. We recommend `Combine-Firewall-Override-List`.
8. Enter a capacity. We recommend `4096`.
9. Enter your exception rules as a Suricata compatible rule string (see [Exception Rule Template](#exception-rule-template)).
10. Choose **Next**, choose **Next** again, and then choose **Create rule group**.

### Attach the Auxiliary Rule Group

After you create the Rule Group, copy its ARN. In the `combine-vpc.yaml` template, set the Parameter for the Firewall you are configuring to that ARN:

```text
CombineFirewallPrivateAuxiliaryRuleGroup
CombineFirewallPublicAuxiliaryRuleGroup
```

To add exceptions later, add lines to the Auxiliary Rule Group using the [Exception Rule Template](#exception-rule-template).
