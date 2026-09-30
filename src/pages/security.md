# Combine AWS Security SOP

## Secure Customer AWS Account Governance and Access

### ACCT-001: Define Secure AWS Account Governance Best Practice

#### Process for Enabling CloudTrail Logs in All Regions

- All applications are provisioned with default CloudTrail tracking.
- To ensure CloudTrail is enabled in all regions:
  1. Sign in to the AWS Management Console.
  2. Navigate to the AWS CloudTrail service.
  3. Click **Create trail** if no trail exists, or edit an existing trail.
  4. Under **Management events**, select **Read/Write events** as needed.
  5. Under **Apply trail to all regions**, ensure this is set to **Yes**.
  6. Select an S3 bucket for log storage and enable encryption.
  7. Click **Create** or **Update trail** to save changes.

#### Process for Enabling Multi-Factor Authentication on Root Account

- Customers are expected to enable MFA on their root accounts after deployment.
- Steps to enable MFA on the root account:
  1. Sign in to the AWS Management Console as the root user.
  2. Navigate to **IAM** from the AWS Console.
  3. Select **Users** and then **Security Credentials**.
  4. Locate the **Multi-factor authentication (MFA)** section and click **Enable MFA**.
  5. Choose either a Virtual MFA device or a Hardware MFA device.
  6. Follow the on-screen instructions to configure the MFA device and enter the generated codes.
  7. Click **Assign MFA** to finalize the process.

#### Process for Setting Contact Information to Corporate Email Address or Phone Number

- Customers are expected to use internal distribution lists and corporate phone numbers as contact information.
  - Single email addresses should not be used, in case the responsible individual departs that role.
- Steps required to set contact information:
  1. Sign in to the AWS Management Console.
  2. Navigate to **Billing Dashboard** from the AWS Console.
  3. Click **Account Settings**.
  4. Under **Contact Information**, update the email address and phone number to a corporate email and number.
  5. Click **Save Changes** to finalize.

#### Process Regarding AWS Account Creation for Customers

- Steps to create a new AWS account for a customer:
  1. Visit https://portal.aws.amazon.com/billing/signup#/start.
  2. Enter the required account information, including the corporate email.
  3. Select the appropriate AWS support plan.
  4. Configure IAM policies for initial security setup.
  5. Enable CloudTrail, AWS Config, and AWS GuardDuty.
  6. Verify account creation and set up appropriate access controls.

#### Process Regarding When to Use Root Account for Workload Activities

- The root account is only used when elevated permissions are required to complete workload activities.
- Examples of permitted use include:
  - Modifying billing settings.
  - Enabling or disabling AWS Organizations.
  - Changing security settings (for example, root user password, MFA, access keys).
  - Other rare administrative tasks requiring root permissions.

#### Process to Protect CloudTrail Logs from Accidental Deletion with Dedicated S3 Bucket

- Steps to back up CloudTrail logs to a dedicated S3 bucket:
  1. Create a dedicated S3 bucket for CloudTrail logs.
  2. Apply an appropriate bucket policy to prevent unauthorized deletions.
  3. Enable versioning to retain historical logs.
  4. Configure an S3 Lifecycle Policy to archive old logs.
  5. Enable server-side encryption for security.
  6. Use AWS IAM policies to restrict access to necessary roles only.
  7. Configure CloudTrail to write logs to this bucket.

### ACCT-002: Define Identity Security Best Practice on How to Access Customer Environment by Leveraging IAM

#### Standard Process for Accessing Customer-Owned AWS Accounts; This Includes AWS Management Console and CLI / API Access

- Customer accounts are federated into directly.
- Customers with more complex security topologies require the use of MFA to access accounts.
- Steps for federated access:
  1. Use an identity provider (for example, AWS SSO, Okta, or Active Directory Federation Services).
  2. Authenticate with corporate credentials.
  3. Assume the required IAM role to access customer AWS accounts.
  4. Use temporary security credentials for API access when applicable.

#### How to Use Customer's Identities / Creds via Federation or AWS Managed Active Directory

- We do not utilize AWS Managed Active Directory.

#### When to Use Temporary Credentials Such as IAM Roles

- Temporary credentials and IAM roles are used as needed.
- IAM roles are used in scenarios such as:
  - Cross-account access for specific workloads.
  - Granting limited permissions to external applications or services.
  - Providing access for automation or CI/CD pipelines.
  - Enabling developers to access AWS resources without long-term credentials.
- Temporary credentials are obtained via the AWS Security Token Service (STS) and are automatically expired based on the configured duration.

## Documentation

### DOC-001: Architecture

- See [the Combine Architectural Diagram](https://docs.sequoiacombine.io/aws/combine-architecture.png) for a full architectural overview.
- Which AWS Services are in use:
  - Lambda
  - S3
  - CloudFront
  - EC2
  - CloudWatch
  - CloudFormation
  - DynamoDB
  - SNS
  - Route 53
  - Elastic Load Balancing
  - AWS Network Firewall
  - IAM
  - EventBridge
  - EC2 Auto Scaling
- How are outside systems connected to the Combine AWS deployment?
  - Outside systems can access the TAP Dashboard front end from the public internet.
    - In order to interact with elements on the dashboard page, systems must have a client certificate installed in their browsers.
  - Authorized users can open SSH sessions to instances in a Combine VPC through the EC2 Instance Connect Endpoint that Combine builds by default, or through AWS Systems Manager Session Manager. Both are authorized with IAM. (Combine no longer creates a bastion host as of Combine 3.14.0.)
- What elements are deployed outside of AWS?
  - No elements are deployed outside of AWS; see [the Combine Architectural Diagram](https://docs.sequoiacombine.io/aws/combine-architecture.png) for reference.
- How are AWS services deployed?
  - AWS services are currently deployed using CloudFormation YAML templates.
- How does the design achieve high availability?
  - All deployed systems are part of auto-scaling groups.
  - Auto-scaling groups have been configured with health checks to automatically monitor and restart services should they fail.
- How does the design scale automatically?
  - EC2 instances are part of auto-scaling groups that scale according to demand.
  - DynamoDB is configured with on-demand capacity.
  - Lambda is configured with on-demand capacity.

## Security - Networking

### NETSEC-001: Security Best Practices for Virtual Private Cloud

- Customer examples need to be developed and linked to this section of the SOP

### NETSEC-002: Data Encryption Policies for Data at Rest and Data in Transit

- Key storage: All keys are stored within AWS infrastructure and only accessible to authenticated users.
  - Need to discuss local storage of keys when developing applications
  - Need to discuss local storage of keys for SSH access to VPC
- Internet Exposed Endpoints & Traffic Encryption:
  - Publicly accessible endpoints have both client and server side certificate requirements.
  - All HTTP communications are mutually encrypted.
  - **Add data at rest / data in transit policies to the public SOP**

## Operational Excellence

### OPE-001: Define, Monitor and Analyze Customer Workload Health KPIs

- Customer examples need to be developed and linked to this section of the SOP
- Operational Metric Thresholds for Triggering Alerts:
  - Alarms are configured in CloudFormation for TAP Servers and Endpoint Servers.
  - Alarms are based on CloudWatch activity as configured within the `combine.yaml` and `combine-vpc.yaml` files.
    - See OPE-001 column 2 for actual policy config (**ADD THIS HERE**)
  - [Link to alarms in console](https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:alarm/TargetTracking-Infra-ECS-Cluster-combine-test-cluster-da051c92-ECSAutoScalingGroup-H0S1tvwSlUOy-AlarmLow-11aa91c2-781a-4d64-b56b-b8c416830139)
- Workload Health KPIs for Customer Workloads:
  - Alarm configurations in the console meet this requirement.
  - **Add details regarding alarm configurations to this bullet**
- Definition, Collection and Analysis of Workload Health Metrics:
  - Currently, analysis of logs is completed via CloudWatch Logs Insights.
  - Alarms have historic occurrence charts built in by default.
  - Notifications of alarms are sent to administrators via email.
