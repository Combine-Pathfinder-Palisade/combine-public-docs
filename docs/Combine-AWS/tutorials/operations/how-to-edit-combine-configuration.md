# Edit Combine Configuration Values

### Overview

_NOTE: This is an advanced operation for users who are operating a self service deployment of Combine. If you have any questions please contact your Combine Support Team._

Combine Configuration allows almost every aspect of Combine's behavior to be modified, frequently without a server restart. Combine Configuration is stored as a series of Parameter / Parameter Value pairs.

### Configuration Store

To override a Combine Configuration value you must make an entry in the Combine Configuration AWS DynamoDB Table. This table is in the Master Region of your Combine Deployment.

The table name is:

`combine-configuration`

If your Combine environment has a Shard ID, then the table name is (with the Shard ID in lowercase):

`combine-<shard id>-configuration`

### Configuration Store Values

Combine Configuration Values have a simple schema:

- `parameter_name` - String Value of the parameter name.
- `parameter_value` - String Value of the parameter value.
- `parameter_type` - Optional String Value indicating the parameter type. (_NOTE: This is for internal use only. Do not set a `parameter_type` manually._)


You may add an entry using the DynamoDB user interface. Be sure to add a new string attribute to set the `parameter_value`.

You may add an entry using the DynamoDB JSON notation as well. The general schema is:

```
{
  "parameter_name": {
    "S": "<parameter_name>"
  },
  "parameter_value": {
    "S": "<parameter_value>"
  }
}
```

For example:

```
{
  "parameter_name": {
    "S": "combine.log.level"
  },
  "parameter_value": {
    "S": "VERBOSE"
  }
}
```

Combine Configuration Values are cached for a configurable duration (default is 60 seconds). Some Combine Configuration Values require a server restart to take effect.

### Example - Changing Configuration Values

If your Combine account is on version 3.13 or later, you can edit configuration values within the TAP Dashboard. If you're on an older version you'll need to update them via the DynamoDB console.

#### Changing Configuration Values via the TAP Dashboard

Note that to change a config value, you must be an `Admin` on the dashboard.


Say you wanted to update the session duration for CAP credentials, as well as the duration of the AWS Console sessions started from the TAP Dashboard. These are handled by two configurations: `combine.tap.users.session.duration.limit` (the maximum duration, in seconds, of CAP credentials) and `combine.tap.users.session.dashboard.duration.default` (the duration, in seconds, of AWS Console sessions started from the TAP Dashboard). Here's how you'd do it!

Navigate to the Metadata Page on the Dashboard. The link to the Metadata Page is in the footer of the Dashboard, next to the Release Notes link.

_NOTE: The Metadata Page is only shown when the `combine.tap.application.feature.metadata` configuration value is `true` (the default is `false`). If you do not see the link, set this value via the DynamoDB console as described below._

![Navigate to the Metadata Page on the Dashboard.](/aws/change-config-metadata-page.png)

Click on the 'Configurations' Tab.

![Click on the 'Configurations' Tab.](/aws/change-config-config-tab.png)

Type in a subset of the configuration value `parameter_name`.

![Type in a subset of the configuration value `parameter_name`.](/aws/change-config-search.png)

Enter in the new value.

![Enter in the new value.](/aws/change-config-change-values.png)

Press 'Enter' to persist the changes.

#### Changing Configuration Values via the DynamoDB Console

Navigate to your Combine configuration table in the DynamoDB console. Click 'Explore table items.'

![](/aws/change-config-dynamodb-table.png)


Expand 'Filters', then enter `parameter_name` in the Attributes field, change the Condition to 'Contains', and type in a subset of the configuration value name. Then click 'Run'.

![](/aws/change-config-dynamodb-search.png)

Click 'Edit' if the configuration value exists; if not, you'll have to click 'Create Item'.

Edit the config to the desired value.

![](/aws/change-config-dynamodb-edit.png)

If creating, create a new config value according to the schema described above. Please ensure the `parameter_value` is a string.

![](/aws/change-config-dynamodb-create.png)

Whether creating or editing, the change will take effect in 3-5 minutes.


Please contact your Combine Support Team for additional information!