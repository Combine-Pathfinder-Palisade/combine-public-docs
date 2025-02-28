# Minor Upgrade

## How to Upgrade a Customer Account

1. Go into the `combine-aws` repository and checkout the current tag (e.g. `git checkout bricks_v_3_13_2`)

4. Build and deploy the Combine components:
    - for versions 3.13 and later: 
      - Perform a `mvn clean package install` in root directory of the `combine-aws` repository. This will build all Combine components and package them as needed.
      - `cd` into `combine-account-automation`
      - Perform this command to do the upgrade: 
        - On Mac/Linux: `java -classpath "lib/*:target/*" com.sequoia.combine.accounts.CombineCommandExecutor migrate_to_3_dot_x --config-store-profile <customer name from clients.json> --bricks-release-version <version number>` (Bricks Version numbers use the format: `bricks_v_<major>_<minor>`.)
        - On Windows: `java -classpath lib/*;target/* com.sequoia.combine.accounts.CombineCommandExecutor migrate_to_3_dot_x --config-store-profile <customer name from clients.json> --bricks-release-version <version number>` (Bricks Version numbers use the format: `bricks_v_<major>_<minor>`.)
    - for versions prior to 3.13:
      - Perform a `npm i && npm run build` in the `combine-tap/tap-dashboard` directory.
      - Perform a `mvn clean install` on the following directories:
        - `combine-commons`
        - `combine-tap/tap-api`
        - `combine-endpoints`
      - Perform a `mvn clean package install` on `combine-account-automation`
      - Run the following command: `mvn exec:java -q "-Dexec.args=update --config-store-profile {CUSTOMER_NAME_FROM_CLIENTS.JSON} --bricks-release-version bricks_v_<major>_<minor>"`

5. Update our customer list: [Customer Accounts Spreadsheet](https://sequoiaholdingsllc-my.sharepoint.com/:x:/g/personal/bking_sequoiainc_com/EfVi7XircpJIsS2v8HHknPcBuRV2Lh3efr3AHteAP_VEcA?e=WfGGpt)

6. Select the customer you want to update (Altana is a good start) and check if they have any specific notes in the spreadsheet or in the Trello ticket (some have multiple VPCs, particular security groups, or other particular requirements)
7. If the selected customer is in the `clients.json` file, you can run the following command:
    - `mvn exec:java -q "-Dexec.args=update --config-store-profile {CUSTOMER_NAME_FROM_CLIENTS.JSON} --bricks-release-version bricks_v_3_12"`

    If not there, please add it to the file! But you can run the same command without the `--config-store-profile` flag and it will simply prompt you for all the relevant customer information, which you could retrieve manually from a couple places, but most quickly from the `customers` directory in the `combine-aws-customers` repo.

8. You may have to still provide some basic inputs even given the proper flags as we are retooling the automation with almost every release. Once the CloudFormation templates have run with no errors and the instance refresh has been executed, you can now test that the update ran successfully.

9. Here are a few sanity checks to run in each account that you upgrade:
    - Log in to the TAP server and check the version number at the bottom of the page
      - Keep in mind that some customers guard access to their TAP server and require additional configuration to access it, as in the case of Salesforce
    - Ensure that the instances sitting in an auto scaling group (TAP and Endpoints) are stable, i.e. not spinning up new instances
