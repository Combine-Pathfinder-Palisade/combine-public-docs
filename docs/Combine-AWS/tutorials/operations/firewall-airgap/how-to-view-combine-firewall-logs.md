# View Customer Firewall Logs

### Steps

1. Log into the AWS Console.
2. Navigate to CloudWatch Console.
3. In the left pane, expand **"Logs"** and click on **"Log Groups"**.
4. In the **Log Groups** window, locate and click on the Log Group `Combine_[CUSTOMER]_Log_Group_Firewall`
5. Ensure the **"Log Streams"** tab is open at the bottom. Click the **"Search all log streams"** button on the right. (For real-time logs, click **"Start Tailing"** instead.)
6. Use the **"Highlight Term"** field to highlight specific strings of interest. (For example, to highlight the IP address `1.2.3.4`, type `1.2.3.4` into the **"Highlight Term"** field.)
7. Look for log entries containing the terms **"reject"** or **"block"**.

### Filtering firewall entries for blocked traffic:

The following filter will find sets of IP addresses that are being blocked:

 ```sh
{ ($.event.dest_ip = "1.2.3.4" || $.event.dest_ip = "1.2.3.4" || $.event.dest_ip = "1.2.3.4") && $.event.alert.action = "blocked" }
 ```
