# Giving a Demo

1. Introduction and brief meeting overview

2. Ask if they have any questions for Brian and sales team

3. Ask if they have seen a demo, if yes, move on. If no, give demo

4. Optional demo:
  - Intro to Combine as a government network emulator for low side development
  - 4 pillars of Combine
    - Service parity - the question of “is everything your workload needs available in the classified region?” Route53 might be available to you on commercial AWS, but it may not have all the same features in the classified regions. If it works in Combine, it will work on the high side
    - Endpoints - How does your software talk to the cloud? We have patented technology that catches your calls and rewrites them to make it look and feel as if you are in the classified cloud region. So you may need to make a call to gitlab in your code, but the URL will not be the same on the high side. Using Combine, you can use the exact same endpoint you would use in the classified region and Combine will re-write it for you under the hood so it all works as it will when you deliver to your customer.
    - Airgapping - no internet available to you when you deploy on the classified cloud region. We put a protective shield around your workload and anything that attempts to reach out to the internet will be blocked and reported on your dashboard
    - Access Control - technology and business policies that identify your software and give it permissions to take actions. We do this by reproducing the proprietary access controls and giving it to you upfront in the unclassified space
  - Show example of service parity as well airgapping and endpoints via command line and dashboard reporting in the demo environment

5. Briefly touch on where to deploy things (combine subnets for customers vs restricted subnets)

6. DONT TOUCH THE PROXY EXCEPT AS A BASTION. DO NOT STORE THINGS THERE. DO NOT RUN WORKLOADS THERE
7. Pause for questions

8. Discuss their specific architecture

9. Get them into the environment/walk through the cert install readme