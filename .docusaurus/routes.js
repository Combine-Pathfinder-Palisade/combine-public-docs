import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/about',
    component: ComponentCreator('/about', '954'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '631'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '515'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', 'ef3'),
            routes: [
              {
                path: '/category/combine-features',
                component: ComponentCreator('/category/combine-features', 'b9e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/category/deployingmaintaining',
                component: ComponentCreator('/category/deployingmaintaining', 'bed'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/category/developing',
                component: ComponentCreator('/category/developing', 'cc1'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/category/how-tos',
                component: ComponentCreator('/category/how-tos', '496'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/deploying-maintaining/account-switching',
                component: ComponentCreator('/Combine AWS/deploying-maintaining/account-switching', 'cd7'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/deploying-maintaining/aws-customer-contacts',
                component: ComponentCreator('/Combine AWS/deploying-maintaining/aws-customer-contacts', 'e65'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/deploying-maintaining/EKS/eks-101',
                component: ComponentCreator('/Combine AWS/deploying-maintaining/EKS/eks-101', '818'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/deploying-maintaining/full-deploy',
                component: ComponentCreator('/Combine AWS/deploying-maintaining/full-deploy', '1a8'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/deploying-maintaining/how-tos/how-to-configure-airgap',
                component: ComponentCreator('/Combine AWS/deploying-maintaining/how-tos/how-to-configure-airgap', '163'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/deploying-maintaining/how-tos/how-to-configure-customer-firewall',
                component: ComponentCreator('/Combine AWS/deploying-maintaining/how-tos/how-to-configure-customer-firewall', '3ac'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/deploying-maintaining/how-tos/how-to-delete-combine-deployment',
                component: ComponentCreator('/Combine AWS/deploying-maintaining/how-tos/how-to-delete-combine-deployment', '1be'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/deploying-maintaining/how-tos/how-to-deploy-to-isolated-customer',
                component: ComponentCreator('/Combine AWS/deploying-maintaining/how-tos/how-to-deploy-to-isolated-customer', '224'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/deploying-maintaining/how-tos/how-to-handle-java-broken-pipe',
                component: ComponentCreator('/Combine AWS/deploying-maintaining/how-tos/how-to-handle-java-broken-pipe', 'd95'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/deploying-maintaining/how-tos/how-to-hotfix',
                component: ComponentCreator('/Combine AWS/deploying-maintaining/how-tos/how-to-hotfix', '057'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/deploying-maintaining/how-tos/how-to-run-java-through-proxychains',
                component: ComponentCreator('/Combine AWS/deploying-maintaining/how-tos/how-to-run-java-through-proxychains', 'f6d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/deploying-maintaining/how-tos/how-to-tail-customer-firewall',
                component: ComponentCreator('/Combine AWS/deploying-maintaining/how-tos/how-to-tail-customer-firewall', 'f19'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/deploying-maintaining/how-tos/how-to-update-service-parity',
                component: ComponentCreator('/Combine AWS/deploying-maintaining/how-tos/how-to-update-service-parity', 'bb2'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/deploying-maintaining/minor-upgrade',
                component: ComponentCreator('/Combine AWS/deploying-maintaining/minor-upgrade', '914'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/deploying-maintaining/other-commands',
                component: ComponentCreator('/Combine AWS/deploying-maintaining/other-commands', '871'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/deploying-maintaining/support-duties',
                component: ComponentCreator('/Combine AWS/deploying-maintaining/support-duties', 'c6d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/developing/all-those-cloudformation-parameters',
                component: ComponentCreator('/Combine AWS/developing/all-those-cloudformation-parameters', '082'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/developing/architecture',
                component: ComponentCreator('/Combine AWS/developing/architecture', 'd62'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/developing/combine-101',
                component: ComponentCreator('/Combine AWS/developing/combine-101', '86f'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/developing/combine-101/automation-tool',
                component: ComponentCreator('/Combine AWS/developing/combine-101/automation-tool', '991'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/developing/combine-101/build-dev-shard',
                component: ComponentCreator('/Combine AWS/developing/combine-101/build-dev-shard', 'ae4'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/developing/combine-101/get-into-bastion',
                component: ComponentCreator('/Combine AWS/developing/combine-101/get-into-bastion', 'e8a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/developing/combine-101/get-into-tap',
                component: ComponentCreator('/Combine AWS/developing/combine-101/get-into-tap', '2dc'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/developing/combine-101/walk-through-endpointservletimplementation',
                component: ComponentCreator('/Combine AWS/developing/combine-101/walk-through-endpointservletimplementation', 'ace'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/developing/endpoints-101',
                component: ComponentCreator('/Combine AWS/developing/endpoints-101', '2fa'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/developing/tag-a-release',
                component: ComponentCreator('/Combine AWS/developing/tag-a-release', '58b'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/features/feature-certificates-csr-signing-api',
                component: ComponentCreator('/Combine AWS/features/feature-certificates-csr-signing-api', 'a15'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/features/feature-certificates-ocsp-support',
                component: ComponentCreator('/Combine AWS/features/feature-certificates-ocsp-support', 'abd'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/Combine AWS/features/feature-vpc-wrapping',
                component: ComponentCreator('/Combine AWS/features/feature-vpc-wrapping', 'b6e'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
