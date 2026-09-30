# Edit Combine Configuration Values

## Overview

_NOTE: This is an advanced operation for users who operate a self-service Combine Deployment. If you have questions, contact your Combine Support Team._

Combine Configuration lets you change almost every aspect of Combine's behavior, often without a server restart. Combine Configuration is stored as a series of Configuration Values, each a pair of a parameter name and a parameter value.

Combine caches Configuration Values for a configurable duration (60 seconds by default). Some Configuration Values take effect only after a server restart.

## Configuration Store

To override a Configuration Value, add an entry to the Combine Configuration table. This DynamoDB table is in the Master Region of your Combine Deployment.

| Combine Deployment | Table name |
|---|---|
| Without a Shard ID | `combine-configuration` |
| With a Shard ID | `combine-<shard id>-configuration` (with the Shard ID in lowercase) |

### Configuration Value Schema

Each entry in the Combine Configuration table has these attributes:

| Attribute | Type | Description |
|---|---|---|
| `parameter_name` | String | The name of the Configuration Value. |
| `parameter_value` | String | The value of the Configuration Value. |
| `parameter_type` | String (optional) | The parameter type. This attribute is for internal use only. Do not set `parameter_type` manually. |

You can add an entry with the form in the DynamoDB console. Be sure to add `parameter_value` as a new String attribute.

You can also add an entry in DynamoDB JSON. The general schema is:

```json
{
  "parameter_name": {
    "S": "<parameter_name>"
  },
  "parameter_value": {
    "S": "<parameter_value>"
  }
}
```

For example, this entry sets `combine.log.level` (see [Log Level](how-to-view-combine-logs.md#log-level)) to `VERBOSE`:

```json
{
  "parameter_name": {
    "S": "combine.log.level"
  },
  "parameter_value": {
    "S": "VERBOSE"
  }
}
```

## Change a Configuration Value

In Combine 3.13 and later, you can edit Configuration Values in the TAP Dashboard. In earlier versions, edit them in the DynamoDB console.

### Change a Configuration Value in the TAP Dashboard

_NOTE: You must be an `Admin` in the TAP Dashboard to change a Configuration Value._

For example, suppose you want to change the session duration of CAP credentials and the duration of AWS Console sessions started from the TAP Dashboard. Two Configuration Values control these:

| Configuration Value | What it controls |
|---|---|
| `combine.tap.users.session.duration.limit` | The maximum duration, in seconds, of CAP credentials. |
| `combine.tap.users.session.dashboard.duration.default` | The duration, in seconds, of AWS Console sessions started from the TAP Dashboard. |

To change them:

1. Open the **Metadata** page. The **Metadata** link is in the footer of the TAP Dashboard, next to the **Release Notes** link.

   _NOTE: The **Metadata** link appears only when the `combine.tap.application.feature.metadata` Configuration Value is `true` (the default is `false`). If you do not see the link, set this value in the DynamoDB console (see [Change a Configuration Value in the DynamoDB Console](#change-a-configuration-value-in-the-dynamodb-console))._

   ![The Metadata link in the footer of the TAP Dashboard.](/aws/change-config-metadata-page.png)

2. Choose the **Configurations** tab.

   ![The Configurations tab on the Metadata page.](/aws/change-config-config-tab.png)

3. In the **Search Configurations** field, type part of the `parameter_name`.

   ![Searching for a Configuration Value by part of its parameter name.](/aws/change-config-search.png)

4. Enter the new value.

   ![Entering a new value for a Configuration Value.](/aws/change-config-change-values.png)

5. Press **Enter** to save the change.

### Change a Configuration Value in the DynamoDB Console

1. In the DynamoDB console, open your Combine Configuration table and choose **Explore table items**.

   ![The Explore table items button on the Combine Configuration table.](/aws/change-config-dynamodb-table.png)

2. Expand **Filters**. Enter `parameter_name` in the **Attribute name** field, change **Condition** to **Contains**, and type part of the Configuration Value name in the **Value** field. Then choose **Run**.

   ![A filter on the parameter_name attribute in the DynamoDB console.](/aws/change-config-dynamodb-search.png)

3. If the Configuration Value exists, choose **Edit** (the pencil icon on its row) and change it to the new value.

   ![Editing an existing Configuration Value in the DynamoDB console.](/aws/change-config-dynamodb-edit.png)

4. If the Configuration Value does not exist, choose **Create item** and create it with the attributes described in [Configuration Value Schema](#configuration-value-schema). Make sure `parameter_value` is a String.

   ![Creating a Configuration Value in the DynamoDB console.](/aws/change-config-dynamodb-create.png)

Whether you create or edit a Configuration Value, the change takes effect within 60 seconds, when Combine refreshes its cached Configuration Values. (Some Configuration Values take effect only after a server restart.)
