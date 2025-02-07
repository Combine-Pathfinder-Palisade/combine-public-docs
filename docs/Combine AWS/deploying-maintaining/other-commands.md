# Other Commands

_last updated: 1/6/2025_

## List all Commands - `CombineCommandList`

The Combine automation tool can display all existing commands; you can run it like this: 
  - On Mac/Linux: `java -classpath "combine-account-automation/lib/*:combine-account-automation/target/*" com.sequoia.combine.accounts.CombineCommandList`
  - On Windows: `java -classpath combine-account-automation/lib/*;combine-account-automation/target/* com.sequoia.combine.accounts.CombineCommandList`

The output will look something like:

```
Command                                   Description                                                           
create_admin_user                         Creates Admin user in TAP, will fail if there is no user management account.
destroy                                   TBD                                                                   
create_greybox_user                       TBD                                                                   
build_certificate_authority               Builds CA and stores in Amazon Certificates Manager.                  
full_no_vpc                               TBD                                                                   
ssh_key_repair                            TBD                                                                   
stage                                     TBD                                                                   
full                                      TBD                                                                   
certificates_repair                       TBD                                                                   
certificates_rebuild_tap                  TBD                                                                   
certificates_rebuild_endpoints            TBD                                                                   
certificates_rebuild_tap_custom_dns       TBD                                                                   
update                                    Updates the customer's devops bucket, does NOT do instance refresh    
build_greybox                             TBD                                                                   
migrate_to_3_dot_x                        Generic Upgrade, not including follower accounts and shards.          
migrate_to_3_dot_12                       Upgrade to 3.12.X; todos are to parameterize the stack names.         
migrate_to_3_dot_13                       Upgrade to 3.13. Does NOT do instance refresh.  
```


## Rebuild TAP Certificates - `certificates_rebuild_tap`

Both TAP certificates, `internal` and `external` (which are for accessing TAP external and internal to the Combine VPC) will expire at some point. Usually this is every two years.

For example:


![](/aws/warning-tap-cert.png)

The cert date is invalid, as you can see from the error (`ERR_CERT_DATE_INVALID`). If we examine the cert we'll confirm this:


![](/aws/expired-tap-cert.png)
(today's date is 1/6/2025)

If the certs expire, users will be presented with a warning in the browser that the certificate served from the TAP server is unsafe due to the expiration.

To do this, run the `certificates_rebuild_tap` command, remembering to build the automation tool jar, as with all other Automation Tool Commands. 

A sample invocation: `mvn exec:java -q "-Dexec.args=certificates_rebuild_tap --config-store-profile customerNameFromClientsDotJson --bricks-release-version bricks_v_3_12_3"`

The command will spit out some logs, ending with this one:

```bash
TAP Certificates Updated in S3.
```

You can confirm this by navigating to the `combine-devops` bucket in the customer's account and checking the tap cert updated dates (certs live in the `/certificates` directory):

![](/aws/cert-updated-dates.png)

The new certificates have overwritten the outdated ones.

From here, you need to perform an [instance refresh](../developing/architecture#instance-refresh) on the TAP autoscaling group, which will run the launch template on the new TAP instances and pull down the new certificates.