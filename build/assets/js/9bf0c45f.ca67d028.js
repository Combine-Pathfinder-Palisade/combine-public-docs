"use strict";(self.webpackChunkmy_website=self.webpackChunkmy_website||[]).push([[5844],{7108:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>a,contentTitle:()=>t,default:()=>h,frontMatter:()=>r,metadata:()=>s,toc:()=>l});const s=JSON.parse('{"id":"Combine AWS/developing/tag-a-release","title":"Tag a Release","description":"How to Build and Tag a Release","source":"@site/docs/Combine AWS/developing/tag-a-release.md","sourceDirName":"Combine AWS/developing","slug":"/Combine AWS/developing/tag-a-release","permalink":"/Combine AWS/developing/tag-a-release","draft":false,"unlisted":false,"editUrl":"https://github.com/Combine-Pathfinder-Palisade/combine-docs/blob/main/docs/Combine AWS/developing/tag-a-release.md","tags":[],"version":"current","lastUpdatedBy":"github-actions","lastUpdatedAt":1739223322000,"frontMatter":{},"sidebar":"tutorialSidebar","previous":{"title":"Endpoints 101","permalink":"/Combine AWS/developing/endpoints-101"},"next":{"title":"Deploying/Maintaining","permalink":"/category/deployingmaintaining"}}');var o=i(4848),c=i(8453);const r={},t="Tag a Release",a={},l=[{value:"How to Build and Tag a Release",id:"how-to-build-and-tag-a-release",level:3}];function d(e){const n={code:"code",h1:"h1",h3:"h3",header:"header",li:"li",ol:"ol",p:"p",ul:"ul",...(0,c.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(n.header,{children:(0,o.jsx)(n.h1,{id:"tag-a-release",children:"Tag a Release"})}),"\n",(0,o.jsx)(n.h3,{id:"how-to-build-and-tag-a-release",children:"How to Build and Tag a Release"}),"\n",(0,o.jsxs)(n.ol,{children:["\n",(0,o.jsxs)(n.li,{children:["Go into the ",(0,o.jsx)(n.code,{children:"combine-account-automation"})," repo and checkout the master branch. Perform a ",(0,o.jsx)(n.code,{children:"git pull"}),"."]}),"\n"]}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsx)(n.li,{children:"If tagging from a non-master branch, you'll have to do some extra work detailed below."}),"\n"]}),"\n",(0,o.jsxs)(n.ol,{start:"2",children:["\n",(0,o.jsxs)(n.li,{children:["Run ",(0,o.jsx)(n.code,{children:"update_versions.sh <major>.<minor>.<patch>"})," in ",(0,o.jsx)(n.code,{children:"combine-account-automation/scripts"})]}),"\n"]}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:["If tagging from a non-master branch, you can grab this script from ",(0,o.jsx)(n.code,{children:"master"})," and run it - it'll work even in prior versions."]}),"\n"]}),"\n",(0,o.jsxs)(n.ol,{start:"3",children:["\n",(0,o.jsxs)(n.li,{children:["Run ",(0,o.jsx)(n.code,{children:"mvn clean install"})," in the ",(0,o.jsx)(n.code,{children:"combine-aws"})," repo root directory to ensure a clean build."]}),"\n"]}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:["If tagging from a non-master branch:","\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:["\n",(0,o.jsxs)(n.p,{children:["Run the relevant ",(0,o.jsx)(n.code,{children:"mvn"})," commands on the following directories:"]}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"combine-commons"})," - ",(0,o.jsx)(n.code,{children:"mvn clean install"})]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"combine-endpoints"})," - ",(0,o.jsx)(n.code,{children:"mvn clean package"})]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"combine-tap"})," - Use the ",(0,o.jsx)(n.code,{children:"build.txt."})," file"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"combine-tomcat"})," - ",(0,o.jsx)(n.code,{children:"mvn clean package"})]}),"\n"]}),"\n"]}),"\n",(0,o.jsxs)(n.li,{children:["\n",(0,o.jsxs)(n.p,{children:["Place all ",(0,o.jsx)(n.code,{children:".war"})," files (endpoints, tap, tomcat jar - found in each project dir/target) in their corresponding dirs in the following root directory:"]}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsx)(n.li,{children:(0,o.jsx)(n.code,{children:"combine-account-automation/src/main/resources/com/sequoia/combine/servers"})}),"\n"]}),"\n",(0,o.jsx)(n.p,{children:"Example commands:"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsx)(n.li,{children:(0,o.jsx)(n.code,{children:"mv combine-tap/tap-api/target/tap-api-3.12.1.war combine-account-automation/src/main/resources/com/sequoia/combine/servers/tap"})}),"\n",(0,o.jsx)(n.li,{children:(0,o.jsx)(n.code,{children:"mv combine-endpoints/target/endpoints-3.12.1.war combine-account-automation/src/main/resources/com/sequoia/combine/servers/endpoints"})}),"\n",(0,o.jsx)(n.li,{children:(0,o.jsx)(n.code,{children:"mv combine-tomcat/target/combine-tomcat-1.2.jar combine-account-automation/src/main/resources/com/sequoia/combine/servers/tomcat"})}),"\n"]}),"\n"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,o.jsxs)(n.ol,{start:"4",children:["\n",(0,o.jsxs)(n.li,{children:["\n",(0,o.jsx)(n.p,{children:"Tag the branch:"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsx)(n.li,{children:(0,o.jsx)(n.code,{children:"git add -A"})}),"\n",(0,o.jsx)(n.li,{children:(0,o.jsx)(n.code,{children:'git commit -m "Updated release number."'})}),"\n",(0,o.jsx)(n.li,{children:(0,o.jsx)(n.code,{children:"git push"})}),"\n",(0,o.jsx)(n.li,{children:(0,o.jsx)(n.code,{children:"git tag <bricks version>"})}),"\n",(0,o.jsx)(n.li,{children:(0,o.jsx)(n.code,{children:"git push origin tag <bricks version>"})}),"\n"]}),"\n"]}),"\n",(0,o.jsxs)(n.li,{children:["\n",(0,o.jsx)(n.p,{children:"Checkout dev and merge master into it and resolve. those. conflicts."}),"\n"]}),"\n"]})]})}function h(e={}){const{wrapper:n}={...(0,c.R)(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(d,{...e})}):d(e)}},8453:(e,n,i)=>{i.d(n,{R:()=>r,x:()=>t});var s=i(6540);const o={},c=s.createContext(o);function r(e){const n=s.useContext(c);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function t(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:r(e.components),s.createElement(c.Provider,{value:n},e.children)}}}]);