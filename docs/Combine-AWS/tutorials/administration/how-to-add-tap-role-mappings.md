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

If your Combine User has the `Admin` or `Super Admin` Role in the TAP Dashboard you can add/delete/modify the TAP Role Mappings.

To do this, click on your User Name in the upper right and choose `Admin Settings`:

![](/aws/add_tap_role_mapping_1.png)

Then choose `TAP Role Mapping`.

![](/aws/add_tap_role_mapping_2.png)

You will see a list of existing TAP Role Mappings (on the `AWS Roles` page):

![](/aws/add_tap_role_mapping_3.png)

A TAP Role Mapping can be created by clicking on the `+` icon (`Map AWS Role`) in the upper right.

A TAP Role Mapping can be edited by clicking on its name.

A TAP Role Mapping can be deleted by clicking on the delete (trash can) icon on its edit page.

On the TAP Role Mapping create/edit page there are several fields:

![](/aws/add_tap_role_mapping_4.png)

* `Environment` - The emulated Partition this TAP Role Mapping applies to. (This will be removed in a future release of Combine as Combine will only support a single emulated Partition in the future.)
* `Account ID` - The AWS Account ID where the IAM Role resides.
* `Account Label` - An alias name for the AWS Account ID where the IAM Role resides. This is used in certain API integrations specific to US Government sponsored Partitions. If you are using this solely for Combine Dashboard Users it can simply be a descriptive name of the account. (It is displayed as the `Account Name` in the AWS Console Access List.)
* `Account Description` - An optional description of the AWS Account. (It is stored with the TAP Role Mapping but is not currently displayed in the AWS Console Access List.)
* `IAM Role Name` - The actual name of the IAM Role in AWS. (For example `Combine-TS-WLDEVELOPER`.)
* `IAM Role Label` - An alias name for the IAM Role. Similar to `Account Label` above. This is used in certain API integrations specific to US Government sponsored Partitions. If you are using this solely for Combine Dashboard Users it can simply be a descriptive name of the role. (It is displayed as the Role name in the AWS Console Access List.)
* `Role Description` - An optional display name or description that is displayed beneath the Role name in the AWS Console Access List to further assist Combine Dashboard Users.
* `Default Role` - When enabled, this TAP Role Mapping is pre-selected when creating a new Combine User, and is automatically assigned to a new Combine User (or Server) that is created without any TAP Role Mappings selected.
