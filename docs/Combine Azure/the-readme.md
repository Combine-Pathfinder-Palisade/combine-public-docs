# The big (slightly outdated) readme from `combine-azure`

# Combine Azure 5.0 🌤

Welcome to the documentation!

:::danger[Broken Links 🔗]

(This page needs to be deconstructed to multiple files, and some of the links don't work)

:::

-------
# Table of Contents
- [General Info] (TBD)
  - [Subscription Mapping](#subscription-mapping)
  - [Developer Onboarding](#developer-onboarding)
  - [Combine Apps](#combine-applications)
  - [Fake vs Real Endpoints](#fake-vs-real-endpoints)
- [Develop & Build](#develop-and-build)
  - [`combine-azure`](#combine-azure)
  - [Development Flow](#development-flow)
    - [Tools](#tools)
      - i.e. Trello, CodeCommit, CodeBuild, Codebuild, Docker
    - [Process](#development-process)
      - 3-way merge, build on master (usually)
  - [App Overview](#app-overview)
    - [Agent](#agent)
      - what it does
      - how its built
      - link to repo
    - [Dashboard](#dashboard)
    - [Function Apps](#function-apps)
    - [Endpoints](#endpoints)
- [Deploy](#deploy)
  - [General Deployment Info](#general-deployment-info)
    - [Storing backend state](#storing-backend-state)
    - [Cloud Spend](#cloud-spend)
  - [Test/Local Deploys](#test-local-deploys)
    - [`deployCombine.sh`](#deploycombinesh)
  - [Production/Customer Deploys](#production-customer-deploys)
    - [Customer Onboarding](#customer-onboarding)
    - [`env0`](#env0)
      - [Post-Deploy Steps](#post-deploy-steps)
        - [Post Deploy Email](#post-deploy-email)
        - [Login Commands Email](#login-commands-email)
        - [Dashboard Account Provisioning](#dashboard-account-provisioning)
- [Maintain](#maintain)
  - [VM Provision Logs](#vm-provision-logs)
  - [`terraform output`](#terraform-output)
  - [Updating Apps](#updating-apps)
  - [Admin Observability Panel](#admin-observability-panel)
  - [Triaging Function App alert emails](#triaging-function-app-alert-emails)
- [Reference/Miscellaneous](#reference-miscellaneous)
  - [Azapi Resource State Issues](#azapi-resource-state-issues)
  - [Charts and Diagrams](#charts-and-diagrams)

-------
# <a id="subscription-mapping"></a>Subscription Mapping

## Service Principals
### Azure Commercial 
  - client/app id - `5a30315d-315e-4b4c-9551-09399774ad66`
  - tenant id - `da7ad64f-db17-4394-adeb-63abcc3696b5`
  - client secret - `o2o=d]-3UnohyX5R.P1z4oyS8u:unCU.`


### Azure Government
  - client/app id - `6f85de64-4b96-40a9-b3fd-53ef6423accc`
  - tenant id - `89cec641-f710-4ce9-a7e6-6e7dd3e63546`
  - client secret - `kB5-aXXq6r7JfmzJ].jiclWzvA8Z]9TS`

## Subscriptions
### Alpha (Commercial) - for devving and testing
- subscription id - `9119303c-f512-4363-8901-85a14271b378`
- Francisco works in this sub usually

### Omega (Commercial) - for devving and testing
- subscription id - `a2356cc2-e111-4630-aa1d-580c021fde6d`
- Daniel works in this sub usually

### Main (Commercial) - for Demos and archetype resources
- Dashboard - https://demo-cts.sequoiacombine.io/
- Super Admin Credentials - 
  - admin
  - c0Mb1neOr4cl3Adm!n
- Test User Azure Portal Credentials - 
  - testuser@hedgesequoiainc.onmicrosoft.com
  - 97Hedge-Sequoia123%%%

### Azure Government 
- subscription id - `8f3be733-d4d9-4b2a-9e0d-711af14f9438`
- nothing live here right now

-------
# <a id="deploys"></a>Deploys

See the `/resources/customer-email-templates` directory for the onboarding template and instructions on how to generate a PDF to send to the customer.

We use [env0](https://www.env0.com) to deploy Combine to customer and production subscriptions. Please see Daniel or another team member to get access to our env0 account.

For local development and testing, we use the `deployCombine.sh` script to deploy to our internal subscriptions. Information on this script is below.

## <a id="deploycombinesh"></a>`deployCombine.sh`

`/infrastructure/terraform/deployCombine.sh` is the entrypoint for the whole infrastructure.

`deployCombine.sh` does three things:
1. collects info about the target subscription
2. creates the new customer's directory from a template
3. runs `terraform` to provision the resources in their subscription

### 1. Collecting User Input
To deploy Combine to a customer's subscription, run the `deployCombine.sh` script. It will collect the following information about the target subscription:
- Environment Type (Commercial to Secret, Commercial to Government, Government to Secret)
- Service Principal's Client ID
- Service Principal's Client Secret
- Location (region) to deploy to
- Subscription ID
- Tenant ID
- Auxiliary Tenant IDs for multi-tenant deployments (honestly not sure what this does, have yet to experiment and understand it)
- Customer Name
- Some flags that determine whether to deploy linux and windows dev boxes

The script takes all of your answers, substitutes them into the sample `terraform.tfvars.example` file, then creates the customer's directory.

### 2. Creating the (Internal) Customer's Directory

There's a `customers/customer-template/` directory inside of `/insfrastructure/terraform/`. This directory is the template from which new customers' directories are generated.

`deployCombine.sh` will copy everything in `customer-template/` into `customers/<customer name>`.

### 3. Running Terraform

`deployCombine.sh` will then create a new workspace named after the customer, initialize and provision all the infrastructure.

A few things to note about terraform:
- all of the artifacts (Dashboard, Agent, Function code, certs, welcome banners, etc.) live in the `seqcombinebootstrap` storage account in our Main Sequoia Subscription. During a deploy, terraform creates a storage account in the customer's subscription and copies each of these into that storage account.

## <a id="storing-backend-state"></a>Storing Backend State

The customer's Backend state is not stored in this directory, but lives in the `combinecustomertfstate` Storage Account in our Main Sequoia Subscription. 

For customer subscriptions, which we manage on env0, we have the option to store the remote state with env0, which we haven't experimented with.

## <a id="production-customer-deploys"></a>Production/Customer Deploys

We have a few markdown templates that can convert to PDF and send to the customer. These can be found in the `resources/customer-email-templates` directory. Please see the `README.md` in that directory to learn how to convert them to pdf.

### <a id="customer-onboarding"></a>Customer Onboarding

We send the onboarding document, converted to pdf (you can find it under `/resources/customer-email-templates/onboarding-email.md` in the `combine-azure` repo) before we deploy.

### <a id="env0"></a>`env0`

More on env0 to come soon.

## <a id="post-deploy-steps"></a>Post-Deploy Steps


### <a id="post-deploy-email"></a> Post-Deploy Email
We have a post-deploy email template that we send to the customer once their deploy is finished. It lives at `/resources/customer-email-templates/post-deploy-email.md` in `combine-azure`. Again, consult the readme in that directory to see how to send it.



### <a id="login-commands-email"></a> Login Commands Email

We also send out an email with a .txt attachment containing the login commands for the customer's jumpboxes in the following format, assuming they are NOT using Bastion:

```
Linux Jumpbox login (connect via your ssh client/terminal of choice)
ssh -i key jumpbox@<jumpbox-ip>

Linux Dev Workstation login (connect from the linux jumpbox)
 (from linux jumpbox): ssh -i azdeveloper-key azdeveloper@Dev-Linux-Workstation

Windows Jumpbox Credentials (connect via your RDP manager of choice)
  username = jumpboxadmin
  password = <password>
  Ip       = 20.66.90.241

Windows Dev Workstation User (connect to this machine from the Windows Jumpbox using Windows Remote Desktop Manager)
  username     = azdeveloper
  password     = <password>
  (private) Ip = 10.3.101.6
```

### <a id="dashboard-account-provisioning"></a>Dashboard Account Provisioning

We also provision accounts for one or two of the customers via the Admin page of the Dashboard.

-------
# <a id="maintain"></a>Maintaining a Customer's Combine Instance

We make use of git tags to manage Combine release versions and customer versions. 

Combine release versions are tagged in the following format:

```json
version-X.0
```

Releases are 'cut' whenever we decide to up the versions. This is quite hand-wavy right now, but will surely be hardened as we onboard more customers.

Customer deploys are tagged in the following format:

```json
client-{customer-name}-{environment-type}
```

For instance, `client-amazon-cts`.

## <a id="vm-provision-logs"></a>App Configuration Logs

The log outputs from the bootstraps for Endpoints, Dashboard and Proxy live on the 
Virtual machines, at this location:

```bash
/var/lib/waagent/custom-script/download/<number>/
```

There is a `stdout` and `stderr` file inside of each `<number>` directory. The latest `<number>` is the count of how many times the bootstrap has been run.

## <a id="terraform-output"></a>Terraform Output

To see all of our diagnostics for a customer's subscription, you can run `terraform output`.

For customer subscriptions, you can `Run a Task` inside of the customer's project in our env0 account.

For local subscriptions, you'll `cd` into the customer's directory and run `terraform output` on the command line.

Note that when you `cd` into a customer's directory, the terraform workspace will change accordingly. For example, if you `cd` into citrix's directory:

```bash
$ pwd
  combine-azure/infrastructure/terraform/customers # you're in the top-level dir
$ terraform workspace list
* default               # only the default workspace is shown here
$ cd citrix
$ terraform workspace list
  default
* citrix                # you're in the citrix workspace
  veritas
```

To see all of our diagnostics for a customer's subscription, you can run `terraform output`, which looks like:

```bash
$ terraform output
Database-Information = {
  "Cosmos-Connection-String" = {
    "connection_string" = "AccountEndpoint=https://combine-8d8fe3125c.documents.azure.com:443/;AccountKey=wMZAzcBOdu7l97E3B9z33vegEWvZezoZeOMnVHYrZxtPgbYx4lDYyj4zx0TTUx4u2apnTk53d3P3ACDbcAceqg==;"
    "database_name" = "customer-data"
    "endpoint" = "https://combine-8d8fe3125c.documents.azure.com:443/"
    "primary_key" = "wMZAzcBOdu7l97E3B9z33vegEWvZezoZeOMnVHYrZxtPgbYx4lDYyj4zx0TTUx4u2apnTk53d3P3ACDbcAceqg=="
    "violations_container_name" = "COMBINE_VIOLATIONS"
  }
}
Login-Information = {
  "Combine-Dev-Windows-Workstation-Password" = "pz0UbpcsEfdAU2t7wcH6LvJvffNjtfl0"
  "Combine-Windows-Jumpbox-Password" = "PEAaUwJsBbpvTXc6fWnPBK20vnkhBh5Q"
  "Linux-Jumpbox-Key" = {
    "Private-Key" = <<-EOT
    -----BEGIN OPENSSH PRIVATE KEY-----
    b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABFwAAAAdz
    ...
    spqpjqvb4YUxeaoNhwh7ZZSfoyN497xzAAAAAAEC
    -----END OPENSSH PRIVATE KEY-----
    
    EOT
    "Public-Key" = <<-EOT
    ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQD6Bj21agwcaKee/QB6U6XHsYCjzICkS8pMUmEj5LArbRjaoE941HETpLCdxdvh6j7Ui0+yKqH4wlzwvtefMHt0iFEjhTC2Lhp7M+N9iCydKbnJZ5bb6ze/JGmWlUoEFbzpCXPbEd2CSSXFDL7Ccjr41WE3nO7mB0X5h2DanPfm3GJLsLvitNzcSr/3P2T1o3wGNq2pYfhdt/79s7EaH8+8VN+Vi01SCWwTuTd2226c03+VDRU1aPSuPAUW0LZXMsZs1FP/f4TQd40ulxNULIho8nQvhikOcDTRu43I+cgC3qW1i371iMQMHHjU2ogrIvCEnpLZwl8DDNvyV4I+ycwz
    
    EOT
  }
  "Linux-Jumpbox-Login-Command" = "ssh -i <linux-jumpbox-private-key> jumpbox@172.174.72.117"
  "VM-IP-Addresses" = {
    "Combine-Dashboard-Public-IP" = "40.114.106.203"
    "Combine-Proxy-Private-IP" = "10.3.0.5"
    "Combine-Proxy-Public-IP" = "172.174.75.235"
    "Combine-Windows-Jumpbox-Private-IP" = "10.3.0.10"
    "Combine-Windows-Jumpbox-Public-IP" = "4.236.132.186"
    "Dev-Linux-Workstation-Private-IP" = "10.3.101.4"
    "Dev-Linux-Workstation-Public-IP" = "20.185.178.238"
    "Dev-Workstation-Private-IP" = "10.3.101.6"
    "Dev-Workstation-Public-IP" = "4.246.166.191"
    "Linux-Jumpbox-Private-IP" = "10.3.0.8"
    "Linux-Jumpbox-Public-IP" = "172.174.72.117"
  }
}
Miscellaneous-Maintenance = {
  "Get-Dashboard-Private-IPs" = "az vmss nic list -g Sequoia-Combine-RG --vmss-name Combine-Dashboard | grep -w privateIpAddress"
  "Get-Endpoints-Private-IPs" = "az vmss nic list -g Sequoia-Combine-RG --vmss-name Combine-Endpoints | grep -w privateIpAddress"
  "Monitor-Function-Apps" = "(Can use Admin Observability panel instead) az monitor app-insights query --app Combine-Insights --analytics-query 'exceptions | where timestamp < ago(10min)' --resource-group Sequoia-Combine-RG"
  "Restart-Function-Apps" = "az functionapp restart --name Combine-Functions-keygen-final-attempt --resource-group Sequoia-Combine-RG"
  "Service-Principal-Login" = "az login --service-principal -u 5a30315d-315e-4b4c-9551-09399774ad66 -p o2o=d]-3UnohyX5R.P1z4oyS8u:unCU. --tenant da7ad64f-db17-4394-adeb-63abcc3696b5"
}
Storage-Account = {
  "access-key" = "Mg4VJ1n216ZFjF51pB0V1JzAWbwbk9lmfaNGJsMdQ3fZVfPhxrYfDq4aDOBZyOkIKF3eKN0uiwWm+AStTGuSYA=="
  "connection-string" = "DefaultEndpointsProtocol=https;AccountName=storagea2356cc2e1114630a;AccountKey=Mg4VJ1n216ZFjF51pB0V1JzAWbwbk9lmfaNGJsMdQ3fZVfPhxrYfDq4aDOBZyOkIKF3eKN0uiwWm+AStTGuSYA==;EndpointSuffix=core.windows.net"
  "container-name" = "combinestoragecontainer"
  "name" = "storagea2356cc2e1114630a"
  "sas_querystring" = "?sv=2017-07-29&ss=bqtf&srt=sco&sp=rwlacp&se=2099-01-01&st=2018-03-21&spr=https&sig=tz8VXpmckdErMPCCMLOBkjoRFXedEw0zt3TIsQRwNNM%3D"
  "violations-queue-endpoint" = "https://storagea2356cc2e1114630a.queue.core.windows.net/"
  "violations-queue-name" = "combine-violations-queue"
}
```

To ssh into the Linux Jumpbox, copy the private key to a file, ensuring that it has LF line feeds, and run the `Linux-Jumpbox-Login-Command`.

When you SSH into the jumpbox you'll notice that there are SSH keys for each of the VMs in the root directory. You can get into the proxy like this, for example:

```bash
# from your local machine, ssh into the Jumpbox:
$ ssh -i citrix-linux-jumpbox jumpbox@52.186.146.166
Last login: Thu Aug 11 17:14:19 2022 from 75-145-88-94-washingtondc.hfc.comcastbusiness.net

<combine welcome banner, removed because it messes up the syntax highlighting in this code snippet>

$ ls
azdeveloper-key  dashboard-key  endpoints-key  programs  proxy-key
$ ssh -i proxy-key proxy@10.3.0.5
Last login: Wed Aug 10 16:03:32 2022 from linux-jumpbox.internal.cloudapp.net
[proxy@Combine-Proxy ~]$   # woohoo, you're in the proxy
```

Note that the users of each of these VMs is `proxy` except for the azdeveloper box; to log into the endpoints you'd do: `ssh -i endpoints-key proxy@Endpoints-IP

To ssh into the Windows Jumpbox, use your favorite Remote Desktop software with the `Combine-Windows-Jumpbox-Public-IP` with the `jumpboxadmin` user and the `Combine-Windows-Jumpbox-Password`.


## <a id="fake-vs-real-endpoints"></a>Fake vs Real Endpoints

For reference, here are the valid Source-Target Environments, or environnent types:
- Commerical -> Government
- Commerical -> Secret (fake endpoints)
- Commerical -> Top Secret (fake endpoints)
- Government -> Secret (fake or real endpoints)
- Government -> Top Secret (fake or real endpoints)

Also for reference, here are the endpoint domain mappings:
Secret (fake) - `scombine.scloud`
Secret (real) - `microsoft.scloud`
Top Secret (fake) - `tscombine.tscloud`
Top Secret (real) - `microsoft.tscloud`

You'll notice tha the Government to Secret (GtS) and Government to Top Secret (GtTS) environment types have fake and real endpoint targets. The customer has to have privileged access via Microsoft to use the real endpoints for either Secret or Top Secret; confer with Stephen or Daniel if a customer requests this.


Below is information on how to cut over from fake to real endpoints for a subscription. This is not done often, but is left here for reference.

### Switching from Fake to Real Endpoints
These two environments can be 'cut over' from using the default 'fake' (i.e. not existent in Azure Secret or Top Secret) endpoints to real endpoints.

This is not automated yet, until then we have to cut over manually. There are a few steps involved in cutting over.

In short, these pieces of the architecture will need to be touched:
- the **Private DNS zone** (maintains the target environment endpoint that is routed to the Endpoints Server)
- the **Proxy Agent**, which allows or denies requests based on the endpoint
- the **Endpoints Server**, which allows or denies requests based on the endpoint, and maps each API call to its Government endpoint equivalent

Of first importance is the configuration value `combine.endpoints.azure.environment.useRealEndpoints`.

Both the Endpoints Server and the Proxy Agent read this config value from the `COMBINE_CONFIGURATION` container on startup. And this value is defined in each customer's `terraform.tfvars`.

So you'll need to change that value in those two places - in the `COMBINE_CUSTOMERS` container and in the `terraform.tfvars`. The former is non-trivial, as we do not even have code to do that yet. For now you could probably jerry-rig the `upsert-configuration-records` project to just update that one record. Changing the .tfvars file is easy.

Once you've changed them both, run `terraform apply`. The DNS zone should be marked for replacement or update, that should be the only change via terraform.

To make the Agent and the Endpoints retrieve the new config value, for now you'll need to restart them. You can SSH into each machine and restart it, or just issue a reboot command of some kind via the azure cli (to use the cli you'll have to log in via the service principal creds of the customer).

Once the terraform has been applied and the apps have been restarted the cutover is complete. 🍾

To test this, you can hop into the test VM, `az logout`, try to `az login --identity --debug` to find that you get a cert error, because the test VM's cloud configuration was NOT updated. Grab the new cloud config from `testVMBootstrap.sh` (based on useRealEndpoints), re-register the cloud config, and try again to confirm that you can log in.

Daniel has tested this extensively and is confident that it works flawlessly.

-------
# <a id="monitoring-a-customers-combine-instance"></a>Monitoring a Customer's Combine Instance

Via the Admin Observability Panel in the Dashboard, you can:
- check the health of the dashboard (we hope to expand what the health check reports on soon)
- run Log Analytics workspace queries (can access Dashboard, Endpoints, Agent and Function logs)
- (eventually) trigger violations with the press of a button!

## <a id="triaging-function-app-alert-emails"></a>Triaging Function App alert emails

There are emails sent to `azure@sequoiainc.com` if the function apps for a customer generate an exception. If Combine is deployed to a commercial subscription then we can query the `exceptions` table via the terraform output `Function-App-Query-Example` to see what the exception is. If the subscription is in Azure Government then the query won't work, unfortunately.. Daniel is still figuring this out.

The email subject line is `Combine Azure Function App Exceptions Alert for <customer-name>!`

The emails so far have been mostly one-offs; however if they keep coming at a cadence of around 5 minutes, there may be an actual issue.

~~To debug, you'll need to login to the customer's subscription via service principal, and run some queries on the function app logs.~~

To debug, head over to the customer's Admin Observability panel and run queries against the function logs. _If_ that fails, you can use the `Monitor-Function-Apps` command as output by terraform.

See the `Miscellaneous-Maintenance` object in `terraform output`, which gives you the `az login` command, as well as a command to query the logs. There is an `exceptions` table and a `traces` table which should give all the information you need.

If all else fails, you can try restarting the function app with the `Function-App-Restart-Command`.

CAVEATS on the function app monitoring:
- this command does not work if the deployment is in Azure government cloud, because of security restrictions I haven't looked into yet. 
- the output from the query command is very large; I recommend piping it to a file that you can open up in an editor.

-------
# <a id="azapi-resource-state-issues"></a>Managing the (sometimes-failing) Terraform Resources

Sometimes terraform does not provision the Custom Logs properly. 

The Custom Logs are provisioned via the experimental [AzApi provider](https://techcommunity.microsoft.com/t5/azure-tools-blog/announcing-azure-terrafy-and-azapi-terraform-provider-previews/ba-p/3270937), which allows the terraforming of not-yet-terraformable resources.

There is a bug that causes these resources' state to not be injected into the terraform state file, so they appear to not exist from terraform's point of view. They are indeed created. 

However, when you `apply` in an existing subscription, Terraform, being unaware that they already exist, will try to create them, but will error out because they already exist.

This error is for the most part harmless. We hope to alleviate these errors in the near future.

-------
# <a id="updating-apps"></a>Updating Apps

Oftentimes you'll have a need to test out one of our apps (Dashboard, Endpoints, Function App) on your own subscription. Or you'll need to update the app on a customer subscription. We have a well-defined process in place for this.

When you push to master, a series of sequential Lambda functions are executed. The end process is that the artifact of the app ends up in the `seqcombinebootstrap` bucket in our Main Subscription. See [this diagram](/azure/Code-Artifact-Path.png) for the specifics.

To copy the artifact from `seqcombinebootstrap` into the your test subscription, you can log into the tenant via the azure cli and do this:

```bash
az storage blob copy start \
  --destination-container destContainer \
  --destination-blob myBlob \
  --source-account-name mySourceAccount \
  --source-account-key mySourceAccountKey \
  --source-container myContainer \
  --source-blob myBlob
```

You can also uze `azcopy` once you generate Blob SAS URLs (which you can do in the portal):

```bash
azcopy copy "https://seqcombinebootstrap.blob.core.windows.net/dashboard-files/combine-dashboard?sp=racwdyti&st=2022-12-06T16:24:37Z&se=2022-12-07T00:24:37Z&spr=https&sv=2021-06-08&sr=b&sig=TuMW8lS9Xd8UbutlH%2BfFfRzO8x%2Ba7z7YazkRqjC44SA%3D" "https://storagea2356cc2e1114630a.blob.core.windows.net/combinestoragecontainer/combine-dashboard?sp=racwdyti&st=2022-12-06T16:22:18Z&se=2022-12-07T00:22:18Z&spr=https&sv=2021-06-08&sr=b&sig=PlbeKJldFVzuWSskc5nwGUX9mp3Efp%2B%2FwFaTKQxSyzU%3D" --recursive
```

Once the artifact is in your target subscription's storage bucket, you can pull it down into the VM with the `re-pull-down` scripts mentioned earlier in this readme.

FIX COPY
To update the customer's Dashboard and/or Agent instances, you will need to:
- upload the new artifact to their storage bucket via the AZ cli
- ssh into their Jumpbox, then into each instance of the Dashboard VM Scale Set (currently we have two running) and the Proxy Instance
- copy the contents of `/infrastructure/developer-scripts/re-pull-down-dashboard.sh`, `re-pull-down-agent.sh` or `re-pull-down-endpoints.sh` into the terminal and run it; this script stops the service running the app, pulls down the one you uploaded to the storage account, and then restarts the service.

-------
# <a id="charts-and-diagrams"></a>Charts and Diagrams

We have several flowcharts that explain how Combine works. These live in `/azure/`. Currently they are:

![Code Pipline Path](/azure/Code-Artifact-Path.png)

![Violation Flow](/azure/Violation-Flow.png)

![Network Topology](/azure/Network-Topology.png)