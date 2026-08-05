# How to Add TAP Role Mappings

## Introduction

A TAP Role Mapping is what connects the TAP Dashboard to an IAM Role in the underlying AWS Account.

Once a TAP Role Mapping exists it can be assigned to a Combine User to allow that Combine User to log into the underlying AWS Account Dashboard through the TAP Dashboard Federation.

A TAP Role Mapping is also used by several API integrations that are specific to US Government sponsored Partitions.

### When Do I Do This?

Combine initializes each Combine Deployment with a set of default TAP Role Mappings. In most cases these are sufficient... but you might need to add additional TAP Role Mappings in the following cases:

(1) You are adding a custom IAM Role to Combine (based on your Sponsor's direction.) You would add a TAP Role Mapping for this IAM Role to allow your Users to assume it into the AWS Console.

(2) You are adding a follower account to a leader account in a multiple account topology. (Combine will initialize the Follower Account with a set of default TAP Role Mappings in the Leader Account... but if you are manually adding an existing Combine account as a follower you may need to do this manually.)

### Administration

If you have an `Admin` User Account in the TAP Dashboard you can add/delete/modify the TAP Role Mappings.

To do this, click on your User Name in the upper right and choose `Admin Settings`:

![](/aws/add_tap_role_mapping_1.png)

Then choose `TAP Role Mapping`.

![](/aws/add_tap_role_mapping_2.png)

You will see a list of existing TAP Role Mappings:

![](/aws/add_tap_role_mapping_3.png)

A TAP Role Mapping can be created by clicking on the `+` icon in the upper right.

A TAP Role mapping can be edited by clicking on its name.

On the TAP Role Mapping create/edit page there are several fields:

![](/aws/add_tap_role_mapping_4.png)

* `Environment` - The emulated Partition this TAP Role Mapping applies to. (This will be removed in a future release of Combine as Combine will only support a single emulated Partition in the futre.)
* `Account ID` - The AWS Account ID where the IAM Role resides.
* `Account Label` - An alias name for the AWS Account ID where the IAM Role resides. This is used in certain API integrations specific to US Government sponsored Partitions. If you are using this solely for Combine Dashboard Users it can simply be a descriptive name of the account.
* `Account Description` - An optional display name or description that is displayed as a tooltip on the Account Name in the AWS Console Access List to further assist Combine Dashboard Users.
* `IAM Role Name` - The actual name of the IAM Role in AWS. (For example `Combine-TS-WLDEVELOPER`.)
* `IAM Role Label` - An alias name for the IAM Role. Similar to `Account Label` above. This is used in certain API integrations specific to US Government sponsored Partitions. If you are using this solely for Combine Dashboard Users it can simply be a descriptive name of the role.
* `Role Description` - An optional display name or description that is displayed as a tooltip on the Role Name in the WS Console Access List to further assist Combine Dashboard Users.
