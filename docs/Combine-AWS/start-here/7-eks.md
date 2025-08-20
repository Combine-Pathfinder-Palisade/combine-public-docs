---
sidebar_position: 6
title: EKS Support

---

# EKS Support

Combine supports EKS emulation. There are a few gotchas to keep in mind when standing up your EKS cluster.

### Add Combine's Endpoint Server Security Group to your Cluster's Security Group

![EKS Cluster Security Group](/aws/eks-cluster-sg.png)

**You will need to add the Endpoint Server's security group to your cluster so that Combine can interact with it,** unless your cluster is open to all traffic.

In the screenshot above, note that the 'Source' of the cluster's security group's first rule references itself; you will need to add a rule like the second one, referencing the Combine Endpoints Server's security group.


## Other Gotchas

- We highly recommend using infrastructure to provision your EKS clusters. ClickOps has not shown to be reliably reproduced, and there are console offerings in the Commercial regions which are not present on the reserved regions, and that Combine is not able to block.
- We recommend using version 1.33 or greater of the <a href="https://github.com/kubernetes-sigs/aws-ebs-csi-driver" target="_blank">AWS EBS CSI driver</a>, 
- Some plugins' helm charts will need to be modified.
- Your Combine instance must have Permissions Boundaries and IAM Self Service enabled. If you are not sure if this is enabled on your account, please reach out to a Combine Team member via <a href="mailto:service-request@sequoiainc.com">email</a>.
- You must prefix all roles that do EKS-related work (node groups, pods, clusters) with <code>PROJECT_</code> as per the customer's high side requirement. Combine will not allow creation of roles that do not follow this format.
- For VPC-only clusters: if the SG on the cluster does not include the cidr block of the node groups, the node groups will not be able to join the cluster. Does not apply to public clusters.

Note that EKS add-ons are in experimental support for Combine right now. If you need to use them, please reach out to a  <a href="mailto:service-request@sequoiainc.com">Combine team member</a> to discuss your use case.

For a complete working example of how to stand up an EKS cluster within Combine, please see our <a href="https://github.com/Combine-Pathfinder-Palisade/combine-examples/tree/main/combine-eks-example" target="_blank">example repository</a>.
