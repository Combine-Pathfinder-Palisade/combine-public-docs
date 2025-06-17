---
sidebar_position: 1
title: Onboarding
---

<img src="/aws/onboarding-images/sequoia-logo.png" width="250"></img>

# Combine Onboarding guide

We are excited to onboard your team to Combine AWS!

Combine AWS is an emulation tool that allows you to build and test your systems as if you were in a classified environment.

Software written for the commercial, unclassified clouds will not work in the classified cloud regions. Combine overcomes this problem by providing a sandbox environment that emulates the classified, air-gapped cloud regions.

It's like high-side for the low-side! Combine's dashboard will report problems which would prevent your solutions from working in classified cloud region, but you can do it from the comfort of your home or office.

Our brains love lists, so here is a summary of the four ways Combine will assist you:
1. **Access control** - Does your code have the permissions it needs to run in the classified cloud? Combine provides the same access control solution as your government customer.
2. **Service parity** - So you want to use Route 53, eh? Is that service avaialble on the high-side? Combine reflects service and feature availability. 
3. **Air gapped networking** - This is simple, it just means no internet! If your code tries to reach out, Combine will block the call and report it to the dashboard.
4. **Endpoints** - Our patented technology intercepts and re-writes your calls to ensure that the endpoints you are trying to hit will be the same in the classified cloud region.

You can find more information about these four capabilities in the [technical details section](#technical-details) of this document.

Now that you know a little more about Combine, let's get started using it. Here's what this guide covers:

1. [Account preparation](#account-preparation) - First, you'll enable your AWS account to receive Combine.
2. [User account setup](#user-account-setup) - Then, we'll provide instructions on how to set up your Combine account.
3. [Technical details](#technical-details) - Lastly, we'll give some technical detail about how it all works.
4. [Your Workload](#your-workload) - This is where _we_ hear from _you_ - what AWS services does your workload utilize?


****

## Account preparation

Click [this link](https://combine-public.s3.amazonaws.com/combine-provisioning.yaml) (you must be signed in to an AWS account) to download the Combine Provisioning Template. 

You can run this in AWS CloudFormation to configure the account, like this:

1. Go to your AWS Console, and type **CloudFormation** into the search bar:

    ![CloudFormation](/aws/onboarding-images/cloudformation-1.png)

2. Next, select **Create stack** and then **With new resources**:

    ![CreateStack](/aws/onboarding-images/cloudformation-2.png)

3. Select the options as shown below, click **Choose file**, and pick the one you downloaded at the beginning of this section:

    ![ChooseFile](/aws/onboarding-images/cloudformation-3.png)

4. Enter a name and note that nothing will show under **Parameters**:

    ![StackName](/aws/onboarding-images/cloudformation-4.png)

5. On the next screen, leave the settings as default and click **Next**.

6. You have made it to the final screen! Just select the checkbox and click **Submit**:

    ![Submit](/aws/onboarding-images/cloudformation-5.png)

7. Finally, please navigate to the CloudFormation stack that you just created and select the **Outputs** tab:

    ![Outputs](/aws/onboarding-images/cloudformation-output.png)

See that ARN Value? We need it! Please copy and paste that value and send it to us at `service-request@sequoiainc.com`.

With that, your account is configured for us to install Combine! We'll do that and let you know when it's live.



****

## User account setup

Now that Combine has been installed in your AWS account, we'll show you how to access it.

Everyone that receives a Combine user account will receive a bespoke credential package via email. The package is bundled as a .zip file and is downloaded using a temporary link in the email. For security reasons, the link will expire after eight hours.

**TIP**: In some cases, our customers' email security solution will quarantine or reject our emails containing the credential packages. You can whitelist the following domain/public IPs to ensure delivery:

  | Domain/Public IP | Value          |
  |------------------|----------------|
  | Email domain     | combine-tap.io |
  | Public IP        | 54.240.47.207  |
  | Public IP        | 54.240.47.208  |  

### Combine dashboard access

The Combine dashboard is where you will do things like manage your user account, navigate to your AWS console, and see when violations are reported. It will look something like this:

![Dashboard](/aws/onboarding-images/dashboard.png)

To access the Combine Dashboard, you will need to install:
1. The Combine trust chain
  - consisting of Certificate Authority and Certificate Authority Signer public certificates 
2. Your personal certificate 
  - consisting of public certificate and private key 
  
These should have been provided to you in your credential package. 

The installation of these certificates is crucial to mimicking the way users are authenticated via certificate in the classified cloud region.

If you follow the steps below, you can install the certs into the Chrome browser in both Windows and MacOS:

### Certificate installation on Windows

1. Install the Combine CA public certificate file (`ca.cert.pem`). On Chrome, navigate to **Settings -> Privacy and security -> Security -> Manage certificates**.
2. In the new Chrome tab that opens, click **Manage imported certificates from Windows**.

    ![](/aws/onboarding-images/windows-manage-certs.png)
3. In the **Certificates** window, click on the **Trusted Root Certification Authorities** tab.

    ![](/aws/onboarding-images/windows-trusted-cert-auth.png)

    * *Tip*: you can use the right/left arrows highlighted below to navigate to the appropriate certificate store.

    ![](/aws/onboarding-images/windows-cert-arrows.png)
4. Click **Import** and follow the prompts to install the `ca.cert.pem` file into the **Trusted Root Certification Authorities** store. 

    * *Note*: When browsing for the `ca.cert.pem` file you may need to adjust the file extension filter in the file dialog so you can see `.pem` files.

    If the import is successful you will see an entry for `Combine CA - <your company name>` in the list of certificates.
5. Install the personal certificate. Double-click on the `<user name>.p12` file in the credential package. You will be prompted to enter the certificate password, located in the `certificates/<user name>_password.txt` file. 
6. Confirm the import by entering your Windows system password.

If you have installed the certificates successfully, browse to the User Portal URL found in the `tap.txt` file. If the Combine landing page loads, then the certificate installation was successful!

### Certificate installation on Mac

1. Install the Combine CA public certificate file (`ca.cert.pem`). On Chrome, navigate to **Settings -> Privacy and security -> Security -> Manage certificates**.
2. In the new Chrome tab that appears, click **Manage imported certificates from MacOS**.

    ![](/aws/onboarding-images/mac-manage-certs.png)
3. When prompted, enter your MacOS system password.
4. Locate **System Keychains** menu and click **System**.

    ![](/aws/onboarding-images/mac-keychain-system.png)
5. Import the `ca.cert.pem` file by dragging it from the credential package folder to the **System** keychain dialog.
6. Confirm import by entering your MacOS system password.

    If the import is successful you will see an entry for `Combine CA - <your company name>` in the list of certificates.

7. Right click the certificate entry in the `Keychain` tool. Click **Info -> Trust** and select **Always Trust** from the dropdown.

    ![](/aws/onboarding-images/cert-trust.png)
8. Install the personal certificate. Double-click on the `<user name>.p12` file in the credential package. You will be prompted to enter the certificate password, located in the `certificates/<user name>_password.txt` file.
9. Confirm the import by entering your MacOS system password.

If you have installed the certificates successfully, browse to the User Portal URL found in the `tap.txt` file. If the Combine landing page loads, then the certificate installation was successful!

****

## SSH access via Bastion

To access the Combine Bastion server (usually used to access a server you have deployed into a private subnet) you may use the EC2 Instance Connect or Session Manager option through the AWS Console.

Browse to EC2 Dashboard.

Select the Combine Bastion server. (It is usually named "Combine-Bastion" but uses the default Name Tag pattern `<ShardId>-<VPC Name>-Bastion` unless you have specified a custom Name Tag.)

Click "Connect".

Choose either the EC2 Instance Connect or Session Manager options.

Click "Connect".

If you would like to use an external SSH Client, you may contact Combine Support for instructions on how to specify an SSH KeyPair, an External Access Security Group, and optionally an Elastic IP Address to enable external SSH access.

### SSH best practices

1. The Combine bastion server is designed to be used by our customers to jump to private subnets, transfer files to the emulated region, etc. However, it is not intended to be used to build or deploy in the emulated region.

2. The Combine bastion server is NOT persistent. It might be terminated and rebuilt during a Combine upgrade.

3. Please coordinate any necessary configuration changes with the Combine support team so they can ensure those changes are persisted across upgrades.



****

## Technical details 

We like our docs to be reader and user friendly, but we know sometimes you just need the technical details. 

This section will cover how Combine works in more depth.

Sequoia Combine is an emulation of the AWS secret (formerly SC2S) and top secret (formerly C2S) cloud regions. 

AWS' secret and top secret regions have technical differences with the AWS commercial cloud region due to the nature of their deployment and their customer base.

Sequoia Combine emulates these technical differences in four primary ways:

1. **Authentication / Authorization**

AWS IAM access in the secret and top secret regions is substantially restricted by the region administrators. Creating, updating, or deleting IAM policies, roles, users, or user groups is prohibited. Directly assuming an IAM role via STS is also prohibited.

End users in these regions have two primary means of authenticating to AWS and authorizing access to AWS APIs:

- CAP / SCAP: CAP and SCAP are identity federation platforms written and maintained by the administrators of the secret and top secret regions, respectively. Both CAP and SCAP provide a user interface and a REST API that authenticates a user via a PKI Certificate and allows that user to federate with an account / role pair in their respective region.

- Attached IAM Roles: secret and top secret accounts support various forms of directly attaching IAM roles to resources (such as EC2 Instance Roles or Lambda Execution Roles). The challenge is that these roles are created through a manual process provided by the administrators of the secret and top secret regions.

IAM roles and the policies that define them must be manually requested in your secret or top secret account and cannot be provisioned via automation. If your existing architecture provisions IAM roles or policies, those resources will need to be factored out of your automation, documented and coordinated manually in the secret / top secret environment, and then passed in as parameters where appropriate.

To request a role in your account, please contact Combine AWS support: `service-request@sequoiainc.com`.

2. **Service Limitations**

Many services (and features of services) that exist in commercial AWS have not yet been deployed to the secret or top secret regions.

To see a summary of services available in each region, please see the **Reference** section of the documentation in the Combine Dashboard.

3. **Airgapped Network**

Secret and top secret accounts are deployed on large private networks that are physically isolated from the internet. As a result, any external resources that your workload depends on will need to be either served locally or replaced with an equivalent on the customer's network.

Sequoia Combine emulates the airgapped nature of secret and top secret environments by placing your workload in subnets whose outbound traffic is routed through a proxy server. That proxy server blocks any outbound network traffic that is not explicitly whitelisted.

To request an addition to your network whitelist, please contact Combine AWS support: `service-request@sequoiainc.com`.

4. **Region-Specific Service Endpoints** 

The endpoints of the REST web services that implement secret and top secret resources are hosted under a different root domain than those in the AWS commercial cloud regions. This means that any time you are using a commercial AWS SDK or the commercial AWS CLI tool you will need to explicitly configure each service to use the appropriate secret or top secret endpoint.

Furthermore, the web service endpoints are protected by a custom SSL certificate authority controlled by the region's administrators. In order to make AWS API calls in secret / top secret regions, you must first trust the specific custom certificate authority chain for that region.

Sequoia Combine emulates the web service endpoints found in the secret and top secret regions, and emulates the custom SSL certificate authority chain as well. Sequoia's Endpoint server responds live to the secret and top secret web service calls, allowing users to configure their SDK and CLI clients to use the same endpoints found in those regions. The emulated endpoints also return secret or top secret specific responses when appropriate.

For a list of secret and top secret endpoints, see the **Reference** section of the documentation in the Combine Dashboard.


****

## CloudFormation behavior in Combine

It’s important to understand that CloudFormation templates launched from the AWS Console or from external CI/CD pipelines run outside of the Combine environment. When launched this way, the resulting API calls are made from the broader AWS network, which means Combine cannot intercept or validate them.

To ensure that Combine applies its enforcement logic — such as endpoint interception, policy validation, and networking rules — CloudFormation templates must be executed from **within the Combine environment**. This can be done using the AWS CLI or SDK tools from a Combine-hosted EC2 instance, EKS pod, or any other in-network resource.

Running templates from within the environment ensures Combine has full visibility and control, accurately reflecting what would happen in a classified region.

## Your Workload

Please help us onboard and support you and your team by answering these questions for us:

- What AWS services will your workload utilize? We'd be especially interested if you're planning to use Elastic Kubernetes Services (EKS), as this will require a bit more hands-on from our team - EKS can be quite complex to configure.
- We can deploy Combine in any US region, but will default to `us-east-1`. If that is a problem, please let us know!
- Are there any deadlines your team is under?
- Are you planning to use Combine at scale with a multi-account setup?

Any other additional information about your team and your workload would be appreciated by our team.
