---
sidebar_position: 7
title: Troubleshooting - EKS

---

# Combine and EKS Support

Combine has support for integrating AWS EKS into an emulated region. However, due to limitations of the AWS EKS architecture there are a several issues to be aware of when standing up your EKS cluster.

### Kubernetes Version

Combine currently supports up to kubernetes version 1.33. We hope to surface this more easily on the Combine Dashboard, but until then you can check the configuration DynamoDb table (usually named `combine-configuration` or similar) for the config value named `combine.endpoints.aws.filter.eks.clusterVersion.aws_<ISO REGION NAME>.versions.allowed`.

### Combine and OIDC

Combine supports EKS OIDC integration without rewriting calls to the OIDC provider — the commercial URL provided by AWS works as-is. 

Typically, users employ the `WLDEVELOPER` role to create the necessary roles. The OIDC provider itself must be created by the government customer on the high side. In Combine, the government customer can be simulated by using the `WLCUSTOMER-IT` role (or an equivalent outside role).

`WLCUSTOMER-IT` grants permissions normally reserved for U.S. Government customers, allowing self-service requests and clarifying that it operates outside the Combine emulation boundary.

NOTE that `WLCUSTOMER-IT` is only for use in simulating actions reserved for the government customer, and not intended for development.

### Security Group

Since Combine is proxying traffic from clients to your EKS cluster it must be granted access to the EKS API.

If your Cluster is open to all traffic within the VPC this is not necessary. If not, at a minimum you will need to give the Combine Endpoint Server Security Group access on your Cluster's Security Group.

![EKS Cluster Security Group](/aws/eks-cluster-sg.png)

In the screenshot above, note that the 'Source' of the EKS Cluster's Security Group's first rule references itself. You will need to add a rule patterned after the second rule above which references Combine Endpoint Server's Security Group.

### Nodes Joining the Cluster

If your nodes are unable to join the cluster, you have several routes to troubleshoot:
- Your Combine 


### Additional Considerations

- We recommend using IaC (Infrastructure as Code) to provision your EKS Cluster(s). ClickOps has been shown to not be reliably reproducible. There are AWS Console offerings in the AWS and AWS GovClud partitions which are not present in the emulated regions.
- We recommend using version 1.33 or greater of the <a href="https://github.com/kubernetes-sigs/aws-ebs-csi-driver" target="_blank">AWS EBS CSI driver</a>.
- Note that Combine does not fully support EKS clusters provisioned with the [terraform AWS EKS module version 21.3.1](https://registry.terraform.io/modules/terraform-aws-modules/eks/aws/21.3.1). We anticipate supporting this very soon!
- The Helm Chart for some Plugins may need to be modified, particularly for AWS commercial ARNs, regions, and availability zones.
- Your Combine instance must have Permissions Boundaries and IAM Self Service enabled. If you are not sure if this is enabled on your account, please reach out to a Combine Team member via <a href="mailto:service-request@sequoiainc.com">email</a>.
- You must prefix all roles that do EKS-related work (node groups, pods, clusters) with <code>PROJECT_</code> as per the customer's high side requirement. Combine will not allow creation of roles that do not follow this format.

Note that EKS add-ons are in experimental support for Combine right now. If you need to use them, please reach out to a  <a href="mailto:service-request@sequoiainc.com">Combine team member</a> to discuss your use case.

For a complete working example of how to stand up an EKS cluster within Combine, please see our <a href="https://github.com/Combine-Pathfinder-Palisade/combine-examples/tree/main/combine-eks-example" target="_blank">example repository</a>.
