"use strict";(self.webpackChunkmy_website=self.webpackChunkmy_website||[]).push([[6908],{6656:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>c,contentTitle:()=>l,default:()=>a,frontMatter:()=>o,metadata:()=>t,toc:()=>d});const t=JSON.parse('{"id":"Combine AWS/deploying-maintaining/how-tos/how-to-tail-customer-firewall","title":"How To: Tail a Customer Firewall to Check for Dropped Traffic","description":"Steps","source":"@site/docs/Combine AWS/deploying-maintaining/how-tos/how-to-tail-customer-firewall.md","sourceDirName":"Combine AWS/deploying-maintaining/how-tos","slug":"/Combine AWS/deploying-maintaining/how-tos/how-to-tail-customer-firewall","permalink":"/Combine AWS/deploying-maintaining/how-tos/how-to-tail-customer-firewall","draft":false,"unlisted":false,"editUrl":"https://github.com/Combine-Pathfinder-Palisade/combine-docs/blob/main/docs/Combine AWS/deploying-maintaining/how-tos/how-to-tail-customer-firewall.md","tags":[],"version":"current","lastUpdatedBy":"github-actions","lastUpdatedAt":1739223322000,"frontMatter":{},"sidebar":"tutorialSidebar","previous":{"title":"How To: Run Java Through Socks Proxy with proxychains","permalink":"/Combine AWS/deploying-maintaining/how-tos/how-to-run-java-through-proxychains"},"next":{"title":"How To: Update Combine Service Parity Definitions","permalink":"/Combine AWS/deploying-maintaining/how-tos/how-to-update-service-parity"}}');var s=i(4848),r=i(8453);const o={},l="How To: Tail a Customer Firewall to Check for Dropped Traffic",c={},d=[{value:"Steps",id:"steps",level:2},{value:"Filtering firewall entries for blocked traffic:",id:"filtering-firewall-entries-for-blocked-traffic",level:2}];function h(e){const n={code:"code",h1:"h1",h2:"h2",header:"header",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,r.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.header,{children:(0,s.jsx)(n.h1,{id:"how-to-tail-a-customer-firewall-to-check-for-dropped-traffic",children:"How To: Tail a Customer Firewall to Check for Dropped Traffic"})}),"\n",(0,s.jsx)(n.h2,{id:"steps",children:"Steps"}),"\n",(0,s.jsxs)(n.ol,{children:["\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.strong,{children:"Locate the Customer Account"})}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"Access the customer's account."}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.strong,{children:"Navigate to CloudWatch"})}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["In AWS, search for ",(0,s.jsx)(n.strong,{children:'"CloudWatch"'}),"."]}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.strong,{children:"Access Log Groups"})}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["In the left pane, expand ",(0,s.jsx)(n.strong,{children:'"Logs"'})," and click on ",(0,s.jsx)(n.strong,{children:'"Log Groups"'}),"."]}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.strong,{children:"Find the Customer Log Group"})}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["In the ",(0,s.jsx)(n.strong,{children:"Log Groups"})," window, locate and click on the log group titled:","\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:(0,s.jsx)(n.code,{children:"Combine_[CUSTOMER]_Log_Group_Firewall"})}),"\n"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.strong,{children:"Search Log Streams"})}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["On the next page, ensure the ",(0,s.jsx)(n.strong,{children:'"Log Streams"'})," tab is open at the bottom."]}),"\n",(0,s.jsxs)(n.li,{children:["Find the ",(0,s.jsx)(n.strong,{children:'"Search all log streams"'})," button on the right and click it."]}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.strong,{children:"Enable Real-Time View"})}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["For real-time logs, click ",(0,s.jsx)(n.strong,{children:'"Start Tailing"'}),"."]}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.strong,{children:"Highlight Specific Terms"})}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["Use the ",(0,s.jsx)(n.strong,{children:'"Highlight Term"'})," field to highlight specific strings of interest.","\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["Example: To highlight the IP address ",(0,s.jsx)(n.code,{children:"1.2.3.4"}),", type ",(0,s.jsx)(n.code,{children:"1.2.3.4"})," into the ",(0,s.jsx)(n.strong,{children:'"Highlight Term"'})," field."]}),"\n"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.strong,{children:"Identify Dropped Traffic"})}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["Look for entries containing the terms:","\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:(0,s.jsx)(n.strong,{children:'"reject"'})}),"\n",(0,s.jsx)(n.li,{children:(0,s.jsx)(n.strong,{children:'"block"'})}),"\n"]}),"\n"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,s.jsx)(n.h2,{id:"filtering-firewall-entries-for-blocked-traffic",children:"Filtering firewall entries for blocked traffic:"}),"\n",(0,s.jsx)(n.p,{children:"The following filter should work to find sets of IP addresses that are being blocked:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-sh",children:'{ ($.event.dest_ip = "1.2.3.4" || $.event.dest_ip = "1.2.3.4" || $.event.dest_ip = "1.2.3.4") && $.event.alert.action = "blocked" }\n\n'})})]})}function a(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(h,{...e})}):h(e)}},8453:(e,n,i)=>{i.d(n,{R:()=>o,x:()=>l});var t=i(6540);const s={},r=t.createContext(s);function o(e){const n=t.useContext(r);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:o(e.components),t.createElement(r.Provider,{value:n},e.children)}}}]);