# Configure AirGap Layer

There are several options to control the AirGap Layer behavior in Combine. These are configured via configuration parameters in the `combine-vpc.yaml` template. 

The Private Firewall (sometimes just called Firewall) handles outbound traffic for private subnets. 

The Public Firewall handles outbound traffic for public subnets. 

The configuration options are the same for both.

## Build/Destroy Firewall

In the `combine-vpc.yaml` template there is a configuration parameter pair:

`CombineFirewallPrivateBuild`
`CombineFirewallPublicBuild`

Setting either of these to `false` completely destroys the respective Firewall and Firewall resources and routes outbound traffic directly to the NAT Gateway / IGW.

### Public Firewall Configuration

The Public Firewall is set to `false` by default. If you would like to have Public Subnets that are inside the AirGap Layer you should set this to `true`. By default it will create an Ingress Route Table for the IGW. 

If you only plan to use the Default Customer Public Subnets (by setting `VpcCustomerSubnetsBuildPublic` to `true`) no additional action is needed. 

If you intend to create your own public subnets you will need to manually create a custom Ingress Route Table and supply that Route Table ID as the `IngressRouteTableOverride` parameter. This Ingress Route Table should have routes for each subnet that resemble:

`<public subnet cidr block> -> <combine public firewall vpc endpoint id>`

This will allow return traffic to the IGW to route back through the Firewall before returning to the originator. 

## Enable/Disable Firewall ("Dropping the AirGap Layer")

You have the option to stop routing outbound traffic through a Firewall through the following configuration parameter:

`EnableAirgap`

Setting this to `false` leaves Private/Public Firewall resources instact but changes the route table so outbound traffic bypasses its respective Firewall and routes directly to the NAT Gateway / IGW.

## Enable/Disable Firewall Permissive Mode

You have the option to allow all outbound traffic but still log each outbound connection on the TAP Dashboard as a Violation through the following configuration parameter:

`EnableAirgapPermissiveMode`

Setting this to `true` while the Private/Public Firewall is in operation (assuming the build flag and `EnableAirgap` configuration parameters are `true`) allows all outbound traffic but still throws a Violation for each outbound call.

## Firewall Exception List 

You have the option to create an exception list for each Firewall. This allows individual domains to be exempted from the airgap layer. 

If this account does not have an override rule group already you will need to create one.

### Create Network Rule Group

To do this, you must create an AWS Network Firewall Rule Group.

Go to VPC Dashboard. On the left navigation list under `Network Firewall` there is a `Network Firewall rule groups` page.
Click `Create Rule Group`.
Choose `Stateful rule group`. 
Choose `Suricata compatible rule string` under `Rule group format`.
Choose `Strict order`.

Click Next.

Choose a name. Recommended: `Combine-Firewall-Override-List`.
Choose a capacity. Recommended: `4092`.

Now you enter a `Suricata compatible rule string`.

Here is a template for a single domain suffix exception:

```
pass tls any any -> any any (msg:"White List"; flow:to_server; tls.sni; content:"<domain suffix>"; nocase; endswith; ssl_state:client_hello; sid:1001; rev:1;)
pass http any any -> any any (msg:"White List"; content:"<domain suffix>"; http_host; endswith; sid:1002; rev:1;)
```

In the above template `<domain suffix>` can be a value such as `github.com` (which matches all domains ending in `github.com`) or `.combine.io` (which matches all subdomains of `combine.io` but NOT `combine.io` itself).

Pay attention to the `sid`. Each line must have a unique `sid` and they are evaluated in order of `sid`.

Click `Next`.
Click `Next`.
Click `Create rule group`.

### Configure Override Rule Group

Once that rule group has been created copy the `ARN` value. Update the `combine-vpc.yaml` template and set the `ARN` value for the appropriate configuration parameter for the Firewall you are configuring:

```
CombineFirewallPrivateAuxiliaryRuleGroup
CombineFirewallPublicAuxiliaryRuleGroup
```

### Set Exemption Rules

Exemptions can be added to the override rule group via the template described above.
