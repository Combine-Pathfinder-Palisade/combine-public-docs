---
sidebar_position: 7
title: Troubleshooting - EKS

---

# EKS Support

Combine has support for integrating AWS EKS into an emulated region. However, due to limitations of the AWS EKS architecture there are a several issues to be aware of when standing up your EKS cluster.

### EKS Security Group

Since Combine is proxying traffic from clients to your EKS cluster it must be granted access to the EKS API.

If you Cluster is open to all traffic within the VPC this is not necessary. If not, at a minimum you will need to give the Combine Endpoint Server Security Group access on your Cluster's Security Group.

![EKS Cluster Security Group](/aws/eks-cluster-sg.png)

In the screenshot above, note that the 'Source' of the EKS Cluster's Security Group's first rule references itself. You will need to add a rule patterned after the second rule above which references Combine Endpoint Server's Security Group.

### Additional Considerations

- We recommend using IaC (Infrastructure as Code) to provision your EKS Cluster(s). ClickOps has been shown to not be reliably reproducible. There are AWS Console offerings in the AWS and AWS GovClud partitions which are not present in the emualted regions.
- We recommend using version 1.33 or greater of the <a href="https://github.com/kubernetes-sigs/aws-ebs-csi-driver" target="_blank">AWS EBS CSI driver</a>, 
- Some plugins' helm charts will need to be modified.
- Your Combine instance must have Permissions Boundaries and IAM Self Service enabled. If you are not sure if this is enabled on your account, please reach out to a Combine Team member via <a href="mailto:service-request@sequoiainc.com">email</a>.
- You must prefix all roles that do EKS-related work (node groups, pods, clusters) with <code>PROJECT_</code> as per the customer's high side requirement. Combine will not allow creation of roles that do not follow this format.
- For VPC-only clusters: if the SG on the cluster does not include the cidr block of the node groups, the node groups will not be able to join the cluster. Does not apply to public clusters.

Note that EKS add-ons are in experimental support for Combine right now. If you need to use them, please reach out to a  <a href="mailto:service-request@sequoiainc.com">Combine team member</a> to discuss your use case.

For a complete working example of how to stand up an EKS cluster within Combine, please see our <a href="https://github.com/Combine-Pathfinder-Palisade/combine-examples/tree/main/combine-eks-example" target="_blank">example repository</a>.
