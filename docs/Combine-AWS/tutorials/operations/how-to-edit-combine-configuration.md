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

Please contact your Combine Support Team for additional information!