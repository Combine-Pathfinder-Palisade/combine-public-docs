---
sidebar_position: 5
title: Troubleshooting
---

# Troubleshooting

If you are experiencing unexpected behavior in Combine here are several tips to help you troubleshoot:

(1) Consult your TAP Dashboard for Alert Events (formerly Violations). Combine will attempt to proactive report any issues it is encounters with a request through the Alert Events interface. (For long time Combine customers, starting in Combine Version 3.13.10 many many new Alert Events were added to help troubleshooting.)

(2) Combine will return a 501 (Not Implemented) HTTP Code in most cases where it is blocking an unsupported Service or Service Feature. (For long time Combine customers, starting in Combine Version 3.13.10 Comboine has also started returning JSON errors even if it does not match the normal AWS API behavior. This was done to accelerate troubleshooting.)
