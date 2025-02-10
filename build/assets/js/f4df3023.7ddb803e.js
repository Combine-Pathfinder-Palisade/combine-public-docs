"use strict";(self.webpackChunkmy_website=self.webpackChunkmy_website||[]).push([[9919],{8710:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>a,contentTitle:()=>c,default:()=>h,frontMatter:()=>t,metadata:()=>o,toc:()=>l});const o=JSON.parse('{"id":"Combine AWS/deploying-maintaining/minor-upgrade","title":"Minor Upgrade","description":"How to Upgrade a Customer Account","source":"@site/docs/Combine AWS/deploying-maintaining/minor-upgrade.md","sourceDirName":"Combine AWS/deploying-maintaining","slug":"/Combine AWS/deploying-maintaining/minor-upgrade","permalink":"/Combine AWS/deploying-maintaining/minor-upgrade","draft":false,"unlisted":false,"editUrl":"https://github.com/Combine-Pathfinder-Palisade/combine-docs/blob/main/docs/Combine AWS/deploying-maintaining/minor-upgrade.md","tags":[],"version":"current","lastUpdatedBy":"github-actions","lastUpdatedAt":1739223322000,"frontMatter":{},"sidebar":"tutorialSidebar","previous":{"title":"Full Deploy Process","permalink":"/Combine AWS/deploying-maintaining/full-deploy"},"next":{"title":"Other Commands","permalink":"/Combine AWS/deploying-maintaining/other-commands"}}');var r=i(4848),s=i(8453);const t={},c="Minor Upgrade",a={},l=[{value:"How to Upgrade a Customer Account",id:"how-to-upgrade-a-customer-account",level:2}];function d(e){const n={a:"a",code:"code",h1:"h1",h2:"h2",header:"header",li:"li",ol:"ol",p:"p",ul:"ul",...(0,s.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.header,{children:(0,r.jsx)(n.h1,{id:"minor-upgrade",children:"Minor Upgrade"})}),"\n",(0,r.jsx)(n.h2,{id:"how-to-upgrade-a-customer-account",children:"How to Upgrade a Customer Account"}),"\n",(0,r.jsxs)(n.ol,{children:["\n",(0,r.jsxs)(n.li,{children:["\n",(0,r.jsxs)(n.p,{children:["Go into the ",(0,r.jsx)(n.code,{children:"combine-account-automation"})," repo and checkout the current tag (e.g. ",(0,r.jsx)(n.code,{children:"git checkout bricks_v_3_12"}),")"]}),"\n"]}),"\n",(0,r.jsxs)(n.li,{children:["\n",(0,r.jsx)(n.p,{children:"Build and deploy the Combine components:"}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:["for versions 3.13 and later:","\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:["Perform a ",(0,r.jsx)(n.code,{children:"mvn clean package install"})," in root directory of the ",(0,r.jsx)(n.code,{children:"combine-aws"})," repository. This will build all Combine components and package them as needed."]}),"\n",(0,r.jsxs)(n.li,{children:["Perform this command to do the upgrade:","\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:["On Mac/Linux: ",(0,r.jsx)(n.code,{children:'java -classpath "combine-account-automation/lib/*:combine-account-automation/target/*" com.sequoia.combine.accounts.CombineCommandExecutor migrate_to_3_dot_x --config-store-profile <customer name from clients.json> --bricks-release-version <version number>'})," (Bricks Version numbers use the format: ",(0,r.jsx)(n.code,{children:"bricks_v_<major>_<minor>"}),".)"]}),"\n",(0,r.jsxs)(n.li,{children:["On Windows: ",(0,r.jsx)(n.code,{children:"java -classpath lib/*;target/* com.sequoia.combine.accounts.CombineCommandExecutor migrate_to_3_dot_x --config-store-profile <customer name from clients.json> --bricks-release-version <version number>"})," (Bricks Version numbers use the format: ",(0,r.jsx)(n.code,{children:"bricks_v_<major>_<minor>"}),".)"]}),"\n"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,r.jsxs)(n.li,{children:["for versions prior to 3.13:","\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:["Perform a ",(0,r.jsx)(n.code,{children:"npm i && npm run build"})," in the ",(0,r.jsx)(n.code,{children:"combine-tap/tap-dashboard"})," directory."]}),"\n",(0,r.jsxs)(n.li,{children:["Perform a ",(0,r.jsx)(n.code,{children:"mvn clean install"})," on the following directories:","\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.code,{children:"combine-commons"})}),"\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.code,{children:"combine-tap/tap-api"})}),"\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.code,{children:"combine-endpoints"})}),"\n"]}),"\n"]}),"\n",(0,r.jsxs)(n.li,{children:["Perform a ",(0,r.jsx)(n.code,{children:"mvn clean package install"})," on ",(0,r.jsx)(n.code,{children:"combine-account-automation"})]}),"\n",(0,r.jsxs)(n.li,{children:["Run the following command: ",(0,r.jsx)(n.code,{children:'mvn exec:java -q "-Dexec.args=update --config-store-profile {CUSTOMER_NAME_FROM_CLIENTS.JSON} --bricks-release-version bricks_v_<major>_<minor>"'})]}),"\n"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,r.jsxs)(n.li,{children:["\n",(0,r.jsxs)(n.p,{children:["Update our customer list: ",(0,r.jsx)(n.a,{href:"https://sequoiaholdingsllc-my.sharepoint.com/:x:/g/personal/bking_sequoiainc_com/EfVi7XircpJIsS2v8HHknPcBuRV2Lh3efr3AHteAP_VEcA?e=WfGGpt",children:"Customer Accounts Spreadsheet"})]}),"\n"]}),"\n",(0,r.jsxs)(n.li,{children:["\n",(0,r.jsx)(n.p,{children:"Select the customer you want to update (Altana is a good start) and check if they have any specific notes in the spreadsheet or in the Trello ticket (some have multiple VPCs, particular security groups, or other particular requirements)"}),"\n"]}),"\n",(0,r.jsxs)(n.li,{children:["\n",(0,r.jsxs)(n.p,{children:["If the selected customer is in the ",(0,r.jsx)(n.code,{children:"clients.json"})," file, you can run the following command:"]}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.code,{children:'mvn exec:java -q "-Dexec.args=update --config-store-profile {CUSTOMER_NAME_FROM_CLIENTS.JSON} --bricks-release-version bricks_v_3_12"'})}),"\n"]}),"\n",(0,r.jsxs)(n.p,{children:["If not there, please add it to the file! But you can run the same command without the ",(0,r.jsx)(n.code,{children:"--config-store-profile"})," flag and it will simply prompt you for all the relevant customer information, which you could retrieve manually from a couple places, but most quickly from the ",(0,r.jsx)(n.code,{children:"customers"})," directory in the ",(0,r.jsx)(n.code,{children:"combine-aws-customers"})," repo."]}),"\n"]}),"\n",(0,r.jsxs)(n.li,{children:["\n",(0,r.jsx)(n.p,{children:"You may have to still provide some basic inputs even given the proper flags as we are retooling the automation with almost every release. Once the CloudFormation templates have run with no errors and the instance refresh has been executed, you can now test that the update ran successfully."}),"\n"]}),"\n",(0,r.jsxs)(n.li,{children:["\n",(0,r.jsx)(n.p,{children:"Here are a few sanity checks to run in each account that you upgrade:"}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:["Log in to the TAP server and check the version number at the bottom of the page","\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsx)(n.li,{children:"Keep in mind that some customers guard access to their TAP server and require additional configuration to access it, as in the case of Salesforce"}),"\n"]}),"\n"]}),"\n",(0,r.jsx)(n.li,{children:"Ensure that the instances sitting in an auto scaling group (TAP and Endpoints) are stable, i.e. not spinning up new instances"}),"\n"]}),"\n"]}),"\n"]})]})}function h(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(d,{...e})}):d(e)}},8453:(e,n,i)=>{i.d(n,{R:()=>t,x:()=>c});var o=i(6540);const r={},s=o.createContext(r);function t(e){const n=o.useContext(s);return o.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:t(e.components),o.createElement(s.Provider,{value:n},e.children)}}}]);