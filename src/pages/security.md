# **Combine AWS Security SOP**


## **Secure Customer AWS Account Governance and Access**

### **ACCT-001: Define Secure AWS Account Governance Best Practice**

#### **Process for enabling CloudTrail logs in all regions**
- All applications are provisioned with default CloudTrail tracking.
- To ensure CloudTrail is enabled in all regions:
  - Sign in to the AWS Management Console.
  - Navigate to the AWS CloudTrail service.
  - Click on "Create trail" if no trail exists, or edit an existing trail.
  - Under "Management events," select "Read/Write events" as needed.
  - Under "Apply trail to all regions," ensure this is set to "Yes."
  - Select an S3 bucket for log storage and enable encryption.
  - Click "Create" or "Update trail" to save changes.

#### **Process for enabling multi-factor authentication on root account**
- Customers are expected to enable MFA on their root accounts after deployment.
- Steps to enable MFA on root account:
  - Sign in to the AWS Management Console as the root user.
  - Navigate to "IAM" from the AWS console.
  - Select "Users" and then "Security Credentials."
  - Locate the "Multi-factor authentication (MFA)" section and click "Enable MFA."
  - Choose either Virtual MFA device or Hardware MFA device.
  - Follow the on-screen instructions to configure the MFA device and enter the generated codes.
  - Click "Assign MFA" to finalize the process.

#### **Process for setting contact information to corporate email address or phone number**
- Customers are expected to use internal distribution lists and corporate phone numbers as contact information
  - Single email addresses should not be used in case the responsible individual departs that role
- Steps required to set contact information:
  - Sign in to the AWS Management Console.
  - Navigate to "Billing Dashboard" from the AWS console.
  - Click "Account Settings."
  - Under "Contact Information," update the email address and phone number to a corporate email and number.
  - Click "Save Changes" to finalize.

#### **Process regarding AWS account creation for customers**
- Steps to create a new AWS account for a customer:
  - Visit https://portal.aws.amazon.com/billing/signup#/start.
  - Enter the required account information, including the corporate email.
  - Select the appropriate AWS support plan.
  - Configure IAM policies for initial security setup.
  - Enable CloudTrail, AWS Config, and AWS GuardDuty.
  - Verify account creation and set up appropriate access controls.

#### **Process regarding when to use root account for workload activities**
- The root account is only used when elevated permissions are required to complete workload activities.
- Examples of permitted use include:
  - Modifying billing settings.
  - Enabling or disabling AWS Organizations.
  - Changing security settings (e.g., root user password, MFA, access keys).
  - Other rare administrative tasks requiring root permissions.

#### **Process to protect CloudTrail logs from accidental deletion with dedicated S3 bucket**
- Steps to back up CloudTrail logs to a dedicated S3 bucket:
  - Create a dedicated S3 bucket for CloudTrail logs.
  - Apply an appropriate bucket policy to prevent unauthorized deletions.
  - Enable versioning to retain historical logs.
  - Configure an S3 Lifecycle Policy to archive old logs.
  - Enable server-side encryption for security.
  - Use AWS IAM policies to restrict access to necessary roles only.
  - Configure CloudTrail to write logs to this bucket.

### **ACCT-002: Define identity security best practice on how to access customer environment by leveraging IAM**

#### **Standard process for accessing customer-owned AWS Accounts; this includes AWS Management Console and CLI / API access**
- Customer accounts are federated into directly.
- Customers with more complex security topologies require the use of MFA to access accounts.
- Steps for federated access:
  - Use an identity provider (e.g., AWS SSO, Okta, or Active Directory Federation Services).
  - Authenticate with corporate credentials.
  - Assume the required IAM role to access customer AWS accounts.
  - Use temporary security credentials for API access when applicable.

#### **How to use customer's identities / creds via federation or AWS Managed Active Directory**
- We do not utilize AWS Managed Active Directory.

#### **When to use temporary credentials such as IAM roles**
- Temporary credentials and IAM roles are used as needed.
- IAM roles are used in scenarios such as:
  - Cross-account access for specific workloads.
  - Granting limited permissions to external applications or services.
  - Providing access for automation or CI/CD pipelines.
  - Enabling developers to access AWS resources without long-term credentials.
- Temporary credentials are obtained via the AWS Security Token Service (STS) and are automatically expired based on the configured duration.

## **Documentation**

### **DOC-001: Architecture**
- See [the Combine Architectural Diagram](https://docs.sequoiacombine.io/assets/images/combine-architecture-1e890aaf06b17fbe510bb677719290fe.png) for a full architectural overview
- Which AWS Services are in use:
  - Lambda
  - S3
  - CloudFront
  - EC2
  - CloudWatch
  - CloudFormation
  - **Continue filling this list**
- How are outside systems are connected to the Combine AWS deployment?
  - Outside systems can access the TAP dashboard front end from the public internet
    - In order to interact with elements on the dashboard page systems must have a client certificate installed in their browsers
  - Outside systems can also access a bastion host (if configured as part of the installation) over a keyed SSH connection
- What elements are deployed outside of AWS?
  - No elements are deployed outside of AWS; see [the Combine Architectural Diagram](https://docs.sequoiacombine.io/assets/images/combine-architecture-1e890aaf06b17fbe510bb677719290fe.png) for reference
- How AWS services are deployed?
  - AWS services are currently deployed using cloudformation yaml templates
- How does the design acheive high availability?
  - All deployed systems are part of auto-scaling groups
  - Auto-scaling groups have been configured with health checks to automatically monitor and restart services should they fail
- How does the design scale automatically?
  - EC2 instances are part of auto-scaling groups that scale according to demand
  - DynamoDB is configured with on-demand capacity
  - Lambda is configured with on-demand capacity

## **Security - Networking**

### **NETSEC-001: Security Best Practices for Virtual Priviate Cloud**
- Customer examples need to be developed and linked to this section of the SOP

### **NETSEC-002: Data Encryption Policies for Data at Rest and Data in Transit**
- Key storage: All keys are stored within AWS infrastructure and only accessible to authenticated users
  - Need to discuss local storage of keys when developing applications
  - Need to discuss local storage of keys for SSH access to VPC
- Internet Exposed Endpoints & Traffic Encryption:
  - Publicly accessible endpoints have both client and server side certificate requirements.
  - All http communications are mutually encrypted. 
  - **Add data at rest / data in transit policies to the public SOP**

## **Operational Excellence**

### **OPE-001: Define, Monitor and Analyze Customer Workload Health KPIs**
- Customer examples need to be developed and linked to this section of the SOP
- Operational Metric Thresholds for Triggering Alerts
  - Alarms are configured in Cloudformation for TAP and Endpoint servers
  - Alarms are based on Cloudwatch actvity as configured within the combine-vpc.yaml file.
    - See OPE-001 column 2 for actual policy config (**ADD THIS HERE**)
  - [Link to alarms in console](https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:alarm/TargetTracking-Infra-ECS-Cluster-combine-test-cluster-da051c92-ECSAutoScalingGroup-H0S1tvwSlUOy-AlarmLow-11aa91c2-781a-4d64-b56b-b8c416830139)
- Workload Health KPIs for Customer Workloads
  - Alarm configurations in the console meet this requirement
  - **Add details regarding alarm configurations to this bullet**
- Definition, Collection and Analysis of Workload Health Metrics
  - Currently, analysis of logs is completed via logs insights.
  - Alarms have historic occurence charts built in by default.
  - Notifications of alarms are sent to administrators via e-mail