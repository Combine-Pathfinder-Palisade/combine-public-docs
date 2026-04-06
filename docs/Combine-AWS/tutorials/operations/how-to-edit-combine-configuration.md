# Edit Combine Configuration Values

### Overview

_NOTE: This is an advanced operation for users who are operating a self service deployment of Combine. If you have any questions please contact your Combine Support Team._

Combine Configuration allows almost every aspect of Combine's behavior to be modified, frequently without a server restart. Combine Configuration is stored as a series of Parameter / Parameter Value pairs.

### Configuration Store

To override a Combine Configuration value you must make an entry in the Combine Configuration AWS DynamoDB Table.

The table name is:

`combine-configuration`

If your Combine environment has a Shard ID, then the table name is:

`combine-<shard id>-configuration`

### Configuration Store Values

Combine Configuration Values have a simple schema:

`parameter_name` - String Value of the parameter name.
`parameter_value` - String Value of the parameter value.
`parameter_type` - Optional String Value indicating the parameter type. (_NOTE: This is for internal use only. Do not set a `parameter_type` manually._)


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

Combine Configuration Values are cached for a configurable duration (default is 60 seconds). Some Combine Configuration Values require a server restart to take affect.

### Example - Changing Configuration Values

If your Combine account is on version 3.13 or later, you can edit configuration values within the TAP Dashboard. If you're on an older version you'll need to update them via the DynamoDb console.

#### Changing Configuration Values via the TAP Dashboard

Note that to change a config value, you must be an `Admin` on the dashboard.


Say you wanted to update the session duration for CAP credentials, as well as the login timeout on the TAP Dashboard. These are both handled by one configuration, `combine.tap.users.session.duration.limit`. Here's you you'd do it!

Navigate to the Metadata Page on the Dashboard.

![Navigate to the Metadata Page on the Dashboard.](/aws/change-config-metadata-page.png)

Click on the 'Configurations' Tab.

![Click on the 'Configurations' Tab.](/aws/change-config-config-tab.png)

Type in a subset of the configuration vlaue `parameter_name`.

![Type in a subset of the configuration value `parameter_name`.](/aws/change-config-search.png)

Enter in the new value.

![Enter in the new value.](/aws/change-config-change-values.png)

Press 'Enter' to persist the changes.

#### Changing Configuration Values via the DynamoDb Console

Navigate to your Combine configuration table in the DynamoDb console. Click 'Explore table items.'

![](/aws/change-config-dynamodb-table.png)


Expand 'Filters', then enter `parameter_name` in the Attributes field, change the Condition to 'Contains', and type in and a subset of the configuration value name. Then click 'Run'.

![](/aws/change-config-dynamodb-search.png)

Click 'Edit' if the configuration value exists; if not, you'll have to click 'Create Item'.

Edit the config to the desired value.

![](/aws/change-config-dynamodb-edit.png)

If creating, create a new config value according to the schema described above. Please ensure the `parameter_value` is a string.

![](/aws/change-config-dynamodb-create.png)

Whether creating or editing, the change will take effect in 3-5 minutes.


Please contact your Combine Support Team for additional information!