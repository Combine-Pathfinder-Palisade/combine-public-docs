# Full Deploy Process

## When Combine onboards a new customer, these are the steps you need to follow to set up their AWS Account:

1. Email customer the `combine-provisioning.yaml` to run in their account.
  - CloudFormation template is located at `combine-account-automation/src/main/resources/com/sequoia/combine/templates/provisioning/combine-provisioning.yaml`
  - Customer needs to provide the Provisioning Role ARN found on the `Outputs` tab in CloudFormation after running this yaml (see next step for full details).
    - Note: This is often done by Brian, who emails us the Role ARN.

2. The customer needs to follow these steps exactly:
  - Navigate to "CloudFormation" on AWS (https://us-east-1.console.aws.amazon.com/cloudformation/)
  - Find "Stacks" and click "Create Stack" > Select "With new resources"
  - For "Prerequisite - Prepare template" select "Choose an existing template"
  - For "Specify Template" select "Upload a template file"
  - Choose the `combine-provisioning.yaml` file referenced in the first step
  - For `Step 2: Specify Stack Details` a name must be provided for the stack
  - Click "Next"
  - For "Configure stack options" leave all settings as they are up to "Capabilities"
  - Under "Capabilities" click the checkbox next to "I acknowledge that AWS CloudFormation might create IAM resources with custom names."
  - Click "Next"
  - For "Review and create" leave all settings as they are and click "Submit"
  - The browser should proceed to a menu under `Cloudformation > Stacks > /<StackName/>`
  - The tab "Events - updated" will be selected
  - The current status should show as `CREATE_IN_PROGRESS`
  - After a couple minutes a number of events will be logged and the status should change to `CREATE_COMPLETE`
  - When provisioning is complete the customer needs to find the `Outputs` tab on the same page and provide us with the `Provisioning Role ARN` value

3. Pull the latest tag for the `combine-aws` repository. (e.g., `git tag -l` then `git checkout <latest_tag>`)

4. Create a `clients.json` (located at `combine-account-automation/clients.json`) entry for the customer using the AWS Account Number and Role ARN they provided in Step 
 - Here is an example json entry for addition to clients.json:
 ```bash
   "customer": {
      "region": "us-east-1",
      "masterRegion": "us-east-1",
      "shardId": "",
      "clientAccountId": "<Customer Account Number>",
      "clientRoleArn": "arn:aws:iam::<Customer Account Number>:role/Combine-Provisioning-Role",
      "bucketEncryptionKey": "",
      "hasUserManagementAccount": "false",
      "followerType": "None",
      "buildTS": "true",
      "buildS": "true",
      "buildGovCloud": "false",
      "certificateName": "Customer",
      "templateParameters": {
        "combine.yaml": {
        },
        "combine-policy.yaml": {
        },
        "combine-vpc.yaml": {
        }
      }
	}
 ```
  - Note: You will need to add this change to the `master` branch since you are working in a tag.

5. Build and deploy the Combine components:
    - for versions 3.13 and later: 
      - simply run `deploy-full.sh` in the `combine-account-automation/scripts` directory. Or you can do it the hard way:
        - Perform a `mvn clean package install` in root directory of the `combine-aws` repository. This will build all Combine components and package them as needed.
        - Perform the actual deploy:
          - On Mac/Linux: `java -classpath "combine-account-automation/lib/*:combine-account-automation/target/*" com.sequoia.combine.accounts.CombineCommandExecutor full --config-store-profile <customer name from clients.json> --bricks-release-version <version number>` (Bricks Version numbers use the format: `bricks_v_<major>_<minor>`.)
          - On Windows: `java -classpath lib/*;target/* com.sequoia.combine.accounts.CombineCommandExecutor full --config-store-profile <customer name from clients.json> --bricks-release-version <version number>` (Bricks Version numbers use the format: `bricks_v_<major>_<minor>`.)
    - for versions prior to 3.13:
      - Perform a `npm i && npm run build` in the `combine-tap/tap-dashboard` directory.
      - Perform a `mvn clean install` on the following directories:
        - `combine-commons`
        - `combine-tap/tap-api`
        - `combine-endpoints`
      - Perform a `mvn clean package install` on `combine-account-automation`
      - Run the following command:
        - `mvn exec:java -q "-Dexec.args=full --config-store-profile {CUSTOMER_NAME_FROM_CLIENTS.JSON} --bricks-release-version bricks_v_3_12"`

6. If the tool runs with no errors, you should be able to log into their AWS account and see Combine resources being created. 

7. After the tool completes navigate to the TAP Dashboard using the admin certificates downloaded from the link provided (or you can retrieve the `admin.zip` from the `combine-app-storage-<account number>-public` bucket) and add any additional users the customer requires. Once they receive their credentials, they often need help authenticating - this often happens live during the onboarding session.

8. Update our customer list: [Customer Accounts Spreadsheet](https://sequoiaholdingsllc-my.sharepoint.com/:x:/g/personal/bking_sequoiainc_com/EfVi7XircpJIsS2v8HHknPcBuRV2Lh3efr3AHteAP_VEcA?e=WfGGpt)

9. You also need to add an entry for the customer in the `combine-aws-customers/customers` repo. This includes the certs, `passwords.txt` file, `tap.txt` file, `README.txt`, etc.
    - `tap.txt` should contain the url of the Load Balancer that points to the customer's TAP Autoscaling group.


------

## FAQs

If you encounter the `Insufficient Elastic IP Addresss available in account!` error in the automation tool, you will need to federate into the customer's account, go to the Service Quotas, and request an increase on the `EC2-VPC Elastic IPs` to at least 10.