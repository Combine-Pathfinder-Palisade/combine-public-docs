# Building a Shard

## Prerequisites
1. maven
2. java openjdk 17
3. Bouncy Castle encryption library `bcprov-jdk18on-1.78.1.jar` in `combine-aws/combine-account-automation/lib/`

### 1. Pull the latest release tag for deployment to the dev shard from the git repository

 - This can be accomplished with `git tag -l` then `git checkout <latest_tag>`
 - Use the following sytax to list the create date of each tag:
 
    ```bash
    git for-each-ref --format='%(refname:short) %(creatordate)' refs/tags
    ```
 - Take note of this value as it will be needed when deploying the installation to AWS
 - The following bash one-liner will check for the latest tag and then check it out automatically:
 
    ```bash
    git for-each-ref --sort=-creatordate --format='%(refname:short)' refs/tags | head -n 1 | xargs git checkout
    ```
 
### 2. Create a `clients.json` entry for your shard

 - `clients.json` is located at `combine-aws/combine-account-automation/clients.json`
 - Here are example json entries for addition to clients.json:

<details>
 <summary>For version 3.14:</summary>

 > ```json
> "shard_id": {
>   "region": "us-east-1",
>   "clientAccountId": "663117128738",
>   "clientRoleArn": "arn:aws:iam::663117128738:role/Combine-Provisioning-Role",
>   "masterRegion": "us-east-1",
>   "shardId": "Shard_id",
>   "hasUserManagementAccount": "false",
>   "bucketEncryptionKey": "",
>   "bucketSetBlockPublicAccess": "true",
>   "buildTS": "true",
>   "buildS": "true",
>   "buildGovCloud": "false",
>   "buildCustomerIT": "true",
>   "emulatedPartitionId": "AWS_SC2S",
>   "bricksReleaseVersion": "bricks_v_3_14",
>   "certificateName": "Shard_id",
>   "configurationFileOverrides": [],
>   "templateParameters": {
>     "combine.yaml": {},
>     "combine-policy.yaml": {},
>     "combine-vpc.yaml": {}
>   }
> },
> ```

</details>

<details>
<summary>For versions 3.13 and prior:</summary>

> ```json
> "example": {
>   "region": "us-east-1",
>   "masterRegion": "us-east-1",
>   "shardId": "Example",
>   "clientAccountId": "663117128738",
>   "clientRoleArn": "arn:aws:iam::663117128738:role/Combine-Provisioning-Role",
>   "bucketEncryptionKey": "",
>   "hasUserManagementAccount": "false",
>   "followerType": "None",
>   "buildTS": "true",
>   "buildS": "true",
>   "buildGovCloud": "false",
>   "certificateName": "Example",
>   "templateParameters": {
>     "combine.yaml": {
>     },
>     "combine-policy.yaml": {
>     },
>     "combine-vpc.yaml": {
>     }
>   }
> }
> ```

</details>

- Note that `"Combine-Example"` will be the final stack name for the 3.13 configuration above.
  - For 3.14 the stack name should be `"Combine-Shard_id"`
- The `shardId` field will have the string `Combine-` prepended to it upon creation.  
- **Remember** to add a leading or trailing comma to the JSON if used inside a larger structure.


### 3. Build and deploy the Combine components:

<details>
<summary>For version 3.14:</summary>

- Check that the proper version of `node.js` is installed
  - List the versions of node present
    - `nvm ls`
  - If there is no `16.20.2` installed, then install it
    - `nvm install 16.20.2`
  - Use version 16.20.2
    - `nvm use 16.20.2`
    - Version 16.20.2 satisfies angular requirements for the tap dashboard
- Perform a `mvn clean package install` in the `combine-aws` directory. This will build most Combine components and package them as needed.
- Perform a `mvn clean install` in the `combine-aws/combine-account-automation` directory. This will build the `combine-tomcat-#.#.jar` file.

- Perform the actual deploy:
  - On Mac/Linux:
    ```bash
    cd combine-account-automation/
    java -classpath "deployment/lib/*:deployment/combine-aws-account-automation.jar:deployment/release/configuration:../combine-tap/tap-api/target/classes/com/sequoia/combine/configuration" com.sequoia.combine.accounts.CombineCommandExecutor full --config-store-profile shard_id
    ```
    
 </details>

<details>
<summary>For version 3.13:</summary>

- Perform a `mvn clean package install` in the `combine-aws` directory. This will build most Combine components and package them as needed.
- Perform a `mvn clean install` in the `combine-aws/combine-account-automation` directory. This will build the `combine-tomcat-#.#.jar` file.

- *Troubleshooting*
  - If installation doesn't work from the `combine-aws` directory then try running the `mvn` command in `combine-aws/combine-account-automation`
  - For a `Could not resolve dependencies` error use the following `grep` format to identify mismatched release values in `pom.xml` files throughout the Combine directories:
    - `cd` into the `combine-aws` directory and run the following grep command:
      ```bash
      grep -rn . -e '<version>3\.13.*'
      ```
    - Replace the major and minor version numbers with the release in use for the deployment.
    - Modify any `value` fields in `parent` nodes in `pom.xml` files that do not match the selected tag/release number.

- Perform the actual deploy:
  - On Mac/Linux:
    ```bash
    cd combine-account-automation/
    java -classpath "lib/*:target/*" com.sequoia.combine.accounts.CombineCommandExecutor full --config-store-profile <customer name from clients.json> --bricks-release-version <version number>
    ```
  - Example command:
    ```bash
    java -classpath "lib/*:target/*" com.sequoia.combine.accounts.CombineCommandExecutor full --config-store-profile combineExample --bricks-release-version bricks_v_3_13_1_1
    ```
  - On Windows:
    ```bash
    java -classpath lib/*;target/* com.sequoia.combine.accounts.CombineCommandExecutor full --config-store-profile <customer name from clients.json> --bricks-release-version <version number>
    ```

- Bricks Version numbers use the format: `bricks_v_<major>_<minor>`

- *Troubleshooting*
  - If the error `Configuration Profile [ProfileName] not found in Configuration Store!` appears then double check that the profile specified from `clients.json` is spelled correctly.
  - If there is a `Bucket resource is in a CREATE_FAILED state.` error then check that the profile name in `clients.json` isn't too long. Bucket names can only be 63 characters.
  - The profile name "example" will create the bucket name `combine-example-connection-logging-us-east-1-663117128738` among others.

</details>

<details>
<summary>For versions prior to 3.13:</summary>

- Run the following in the `combine-tap/tap-dashboard` directory:
  ```bash
  npm i && npm run build
  ```

- Run `mvn clean install` in each of the following directories:
  - `combine-commons`
  - `combine-tap/tap-api`
  - `combine-endpoints`

- Run `mvn clean package install` in:
  - `combine-account-automation`

- Execute the following command to deploy:
  ```bash
  mvn exec:java -q "-Dexec.args=full --config-store-profile {CUSTOMER_NAME_FROM_CLIENTS.JSON} --bricks-release-version bricks_v_3_12"
  ```

</details>

<details>
  <summary>These prompts will only appear if the clients.json profile fails to load.</summary>

  - Configuration Store File not found!
  - Enter Client AWS Account ID: `<enter account ID>`
  - Enter Shard ID (optional): CShrout
  - Enter Region: us-east-1
  - Enter Master Region: us-east-1
  - Use JSON STS Token Credentials?: no
  - Enter Client Account Access Key : `<enter access key>`
  - Enter Client Account Access Key Secret: `<enter access key secret>`
  - Enter Client Account Session Token (optional): 
  - Has User Management Account?: no
  - Enter DevOps Bucket Encryption Key (optional): 
  - Loading parameter [bricksReleaseVersion] value [bricks_v_3_13_1_1] from store.
  - Enter Client Certificate Name: CShrout
  - Build Top Secret region emulation?: yes
  - Build Secret region emulation?: no
  - Build GovCloud region emulation?: no

</details>

### 4. Retrieve keys and CA; see [Connecting to the Bastion Server via SSH](./get-into-bastion.md) for full details on retrieval.
  - After locating `admin.zip` for the appropriate stack, unzip and locate `ca.cert.pem`

### 5. Set up the CA on the local system:

### Adding a Certificate Authority to Web Browsers in macOS

Here’s how to add a certificate authority (CA) to Safari, Chrome, and Firefox on macOS.

<details>
  <summary>1. Add the CA to macOS Keychain (Affects Safari and Chrome)</summary>

#### Steps:
1. **Open Keychain Access**:
   - Use Spotlight (`Command + Space`) and search for **Keychain Access**.

2. **Import the Certificate**:
   - Go to **File > Import Items**.
   - Select the CA certificate file (`ca.cert.pem`).

3. **Trust the Certificate**:
   - Find the imported certificate in the **Certificates** category.
   - Double-click the certificate to open its details.
   - Expand the **Trust** section and set **When using this certificate** to **Always Trust**.
   - Close the window, and authenticate with your macOS password.

4. **Restart Browsers**:
   - Restart Safari and Chrome to recognize the updated trusted CA.

</details>

<details>
  <summary>2. Add the CA to Firefox (Separate Certificate Store)</summary>

#### Steps:
1. **Open Firefox Settings**:
   - Click the hamburger (3 line) menu in the upper right and select `Settings`
     - Alternatively, Type `about:preferences` in the Firefox address bar.
   - Find **Privacy & Security** on the left hand side of the window.

2. **Manage Certificates**:
   - Scroll to the **Certificates** section and click **View Certificates**.

3. **Import the Certificate**:
   - Go to the **Authorities** tab.
   - Click **Import** and select the CA certificate file (`ca.cert.pem`).
   - Check **Trust this CA to identify websites**.

4. **Restart Firefox**:
   - Restart Firefox to apply the changes.

</details>

#### Key MAC OS Notes
- **Global Trust**: Adding a CA to the macOS Keychain applies system-wide, affecting all apps and browsers using the macOS trust store.
- **Per-Browser Trust**: Adding a CA to Firefox applies only to Firefox since it uses its own certificate store.

---

### Adding a Certificate Authority to Web Browsers in Windows 11

Here’s how to add a certificate authority (CA) to browsers (including Firefox) in Windows 11.

<details>
  <summary>1. Add the CA to Windows Certificate Store (Affects Edge and Chrome)</summary>

#### Steps:
1. **Open Certificate Manager**:
   - Press `Win + R`, type `mmc`, and hit **Enter**.
   - In the **Microsoft Management Console (MMC)**, go to **File > Add/Remove Snap-in**.

2. **Add Certificates Snap-in**:
   - In the dialog, select **Certificates** and click **Add**.
   - Choose **Computer account** (not user account) and click **Next**, then **Finish**.

3. **Import the Certificate**:
   - Expand **Trusted Root Certification Authorities** and right-click on **Certificates**.
   - Select **All Tasks > Import** and follow the wizard to locate and add the CA certificate file (`.crt` or `.cer`).

4. **Restart Browsers**:
   - Restart Edge and Chrome to recognize the updated trusted CA.

</details>

<details>
  <summary>2. Add the CA to Firefox (Separate Certificate Store)</summary>

Firefox uses its own certificate store, so it requires separate configuration.

#### Steps:
1. **Open Firefox Settings**:
   - Click the hamburger (3 line) menu in the upper right and select `Settings`
     - Alternatively, Type `about:preferences` in the Firefox address bar.
   - Find **Privacy & Security** on the left hand side of the window.

2. **Manage Certificates**:
   - Scroll to the **Certificates** section and click **View Certificates**.

3. **Import the Certificate**:
   - Go to the **Authorities** tab.
   - Click **Import** and select the CA certificate file (`ca.cert.pem`).
   - Check **Trust this CA to identify websites**.

4. **Restart Firefox**:
   - Restart Firefox to apply the changes.

</details>

#### Key Windows Notes
- **Global Trust**: Adding a CA to the Windows Certificate Store applies system-wide, affecting browsers like Edge and Chrome.
- **Per-Browser Trust**: Adding a CA to Firefox only affects Firefox, as it uses its own certificate store.

---

### 6. If the tool runs with no errors, you should be able to log into AWS account and see Combine resources being created. 
