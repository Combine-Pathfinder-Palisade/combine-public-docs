# How To: Tail a Customer Firewall to Check for Dropped Traffic

## Steps

1. **Locate the Customer Account**
   - Access the customer's account.

2. **Navigate to CloudWatch**
   - In AWS, search for **"CloudWatch"**.

3. **Access Log Groups**
   - In the left pane, expand **"Logs"** and click on **"Log Groups"**.

4. **Find the Customer Log Group**
   - In the **Log Groups** window, locate and click on the log group titled:
     - `Combine_[CUSTOMER]_Log_Group_Firewall`

5. **Search Log Streams**
   - On the next page, ensure the **"Log Streams"** tab is open at the bottom.
   - Find the **"Search all log streams"** button on the right and click it.

6. **Enable Real-Time View**
   - For real-time logs, click **"Start Tailing"**.

7. **Highlight Specific Terms**
   - Use the **"Highlight Term"** field to highlight specific strings of interest.
     - Example: To highlight the IP address `1.2.3.4`, type `1.2.3.4` into the **"Highlight Term"** field.

8. **Identify Dropped Traffic**
   - Look for entries containing the terms:
     - **"reject"**
     - **"block"**

## Filtering firewall entries for blocked traffic:
 The following filter should work to find sets of IP addresses that are being blocked:

 ```sh
{ ($.event.dest_ip = "1.2.3.4" || $.event.dest_ip = "1.2.3.4" || $.event.dest_ip = "1.2.3.4") && $.event.alert.action = "blocked" }

 ```