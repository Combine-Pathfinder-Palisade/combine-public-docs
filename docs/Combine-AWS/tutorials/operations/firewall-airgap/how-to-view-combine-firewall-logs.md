# View Combine Firewall Logs

The Combine Firewall writes the connections it alerts on or blocks to the `Combine_Firewall` CloudWatch Log Group. For which connections appear in this Log Group, see [Log Streams](../how-to-view-combine-logs.md#log-streams) in View Combine Logs.

## Steps

1. Sign in to the AWS Console.
2. Open the CloudWatch console.
3. In the left pane, expand **Logs** and choose **Log Groups**.
4. In the **Log Groups** window, choose the `Combine_Firewall` Log Group (or `Combine_<shard id>_Firewall` if your Combine Deployment has a Shard ID).
5. Make sure the **Log Streams** tab is open at the bottom, and choose **Search all log streams** on the right. For real-time logs, choose **Start Tailing** instead.
6. To highlight a string of interest, type it in the **Highlight Term** field. For example, to highlight the IP address `1.2.3.4`, type `1.2.3.4`.
7. Look for log entries that contain `reject` or `block`.

## Filter for Blocked Traffic

The following filter pattern finds blocked traffic to a set of IP addresses:

```sh
{ ($.event.dest_ip = "1.2.3.4" || $.event.dest_ip = "5.6.7.8" || $.event.dest_ip = "9.10.11.12") && $.event.alert.action = "blocked" }
```

For more filter patterns and for CloudWatch Logs Insights, see [Sample Queries](../how-to-view-combine-logs.md#sample-queries) and [Use CloudWatch Logs Insights](../how-to-view-combine-logs-log-insights.md). To exempt a domain from the Combine Firewall, see [Firewall Exception List](how-to-configure-airgap-layer.md#firewall-exception-list).
