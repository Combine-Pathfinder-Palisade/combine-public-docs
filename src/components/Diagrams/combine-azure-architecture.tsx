import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export const CombineAzureArchitecture = () => {
  const svgRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 1400;
    const height = 900;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Define gradients and patterns
    const defs = svg.append('defs');
    
    const vnetGradient = defs.append('linearGradient')
      .attr('id', 'vnetGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    vnetGradient.append('stop').attr('offset', '0%').attr('stop-color', '#0078d4').attr('stop-opacity', 0.1);
    vnetGradient.append('stop').attr('offset', '100%').attr('stop-color', '#0078d4').attr('stop-opacity', 0.05);

    const subnetGradient = defs.append('linearGradient')
      .attr('id', 'subnetGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    subnetGradient.append('stop').attr('offset', '0%').attr('stop-color', '#50e6ff').attr('stop-opacity', 0.2);
    subnetGradient.append('stop').attr('offset', '100%').attr('stop-color', '#50e6ff').attr('stop-opacity', 0.05);

    // Arrow markers
    const arrowColors = ['0078d4', 'd83b01', '00a4ef', '7fba00', 'e81123', '666666'];
    arrowColors.forEach(color => {
      defs.append('marker')
        .attr('id', 'arrowhead-' + color)
        .attr('markerWidth', 12)
        .attr('markerHeight', 12)
        .attr('refX', 11)
        .attr('refY', 4)
        .attr('orient', 'auto')
        .append('polygon')
        .attr('points', '0 0, 12 4, 0 8')
        .attr('fill', '#' + color);
    });

    // Public Internet zone - dotted square
    const publicZone = svg.append('g');
    publicZone.append('rect')
      .attr('x', 50)
      .attr('y', 50)
      .attr('width', 350)
      .attr('height', 800)
      .attr('rx', 10)
      .attr('fill', '#f9f9f9')
      .attr('stroke', '#666')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '15,8');

    publicZone.append('text')
      .attr('x', 80)
      .attr('y', 90)
      .attr('font-size', 28)
      .attr('font-weight', 'bold')
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#666')
      .text('Public Internet');

    // Azure Bastion - inside public internet zone
    const bastionGroup = svg.append('g')
      .attr('class', 'clickable')
      .style('cursor', 'pointer');

    bastionGroup.append('rect')
      .attr('x', 80)
      .attr('y', 120)
      .attr('width', 160)
      .attr('height', 120)
      .attr('rx', 8)
      .attr('fill', '#ffffff')
      .attr('stroke', '#0078d4')
      .attr('stroke-width', 3);

    // Bastion icon (shield)
    bastionGroup.append('path')
      .attr('d', 'M160 145 L145 140 L145 165 C145 172 150 177 160 180 C170 177 175 172 175 165 L175 140 Z')
      .attr('fill', '#0078d4')
      .attr('stroke', '#005a9e')
      .attr('stroke-width', 1);

    bastionGroup.append('text')
      .attr('x', 160)
      .attr('y', 205)
      .attr('text-anchor', 'middle')
      .attr('font-size', 18)
      .attr('font-weight', 'bold')
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#0078d4')
      .text('Azure Bastion');

    bastionGroup.append('text')
      .attr('x', 160)
      .attr('y', 228)
      .attr('text-anchor', 'middle')
      .attr('font-size', 14)
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#666')
      .text('10.3.4.0/23');

    // Dashboard - inside public internet zone
    const dashboard = svg.append('g')
      .attr('class', 'clickable')
      .style('cursor', 'pointer')
      .on('click', () => setSelectedNode('dashboard'));

    dashboard.append('rect')
      .attr('x', 80)
      .attr('y', 280)
      .attr('width', 160)
      .attr('height', 120)
      .attr('rx', 8)
      .attr('fill', '#ffffff')
      .attr('stroke', '#00a4ef')
      .attr('stroke-width', 3);

    // Dashboard icon (chart)
    dashboard.append('rect')
      .attr('x', 130)
      .attr('y', 325)
      .attr('width', 12)
      .attr('height', 30)
      .attr('fill', '#00a4ef');
    dashboard.append('rect')
      .attr('x', 148)
      .attr('y', 315)
      .attr('width', 12)
      .attr('height', 40)
      .attr('fill', '#00a4ef');
    dashboard.append('rect')
      .attr('x', 166)
      .attr('y', 320)
      .attr('width', 12)
      .attr('height', 35)
      .attr('fill', '#00a4ef');
    dashboard.append('rect')
      .attr('x', 184)
      .attr('y', 310)
      .attr('width', 12)
      .attr('height', 45)
      .attr('fill', '#00a4ef');

    dashboard.append('text')
      .attr('x', 160)
      .attr('y', 380)
      .attr('text-anchor', 'middle')
      .attr('font-size', 18)
      .attr('font-weight', 'bold')
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#00a4ef')
      .text('Dashboard');

    dashboard.append('text')
      .attr('x', 160)
      .attr('y', 400)
      .attr('text-anchor', 'middle')
      .attr('font-size', 13)
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#666')
      .text('Container App');

    // Cosmos DB - outside public zone, below it
    const cosmosDB = svg.append('g')
      .attr('class', 'clickable')
      .style('cursor', 'pointer')
      .on('click', () => setSelectedNode('cosmosdb'));

    cosmosDB.append('rect')
      .attr('x', 60)
      .attr('y', 600)
      .attr('width', 180)
      .attr('height', 120)
      .attr('rx', 8)
      .attr('fill', '#ffffff')
      .attr('stroke', '#7fba00')
      .attr('stroke-width', 3);

    // Cosmos DB icon (cylinder stack)
    const cosmosX = 150;
    const cosmosY = 635;
    for (let i = 0; i < 3; i++) {
      cosmosDB.append('ellipse')
        .attr('cx', cosmosX)
        .attr('cy', cosmosY + i * 15)
        .attr('rx', 30)
        .attr('ry', 8)
        .attr('fill', i === 2 ? '#7fba00' : 'none')
        .attr('stroke', '#7fba00')
        .attr('stroke-width', 2);
    }

    cosmosDB.append('text')
      .attr('x', 150)
      .attr('y', 695)
      .attr('text-anchor', 'middle')
      .attr('font-size', 18)
      .attr('font-weight', 'bold')
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#7fba00')
      .text('Cosmos DB');

    cosmosDB.append('text')
      .attr('x', 150)
      .attr('y', 715)
      .attr('text-anchor', 'middle')
      .attr('font-size', 13)
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#666')
      .text('Violations Store');

    // Storage Account - below Cosmos DB
    const storageAccount = svg.append('g')
      .attr('class', 'clickable')
      .style('cursor', 'pointer')
      .on('click', () => setSelectedNode('storage'));

    storageAccount.append('rect')
      .attr('x', 60)
      .attr('y', 750)
      .attr('width', 180)
      .attr('height', 120)
      .attr('rx', 8)
      .attr('fill', '#ffffff')
      .attr('stroke', '#0072c6')
      .attr('stroke-width', 3);

    // Storage icon (filing cabinet)
    storageAccount.append('rect')
      .attr('x', 120)
      .attr('y', 780)
      .attr('width', 60)
      .attr('height', 50)
      .attr('fill', '#0072c6')
      .attr('stroke', '#004578')
      .attr('stroke-width', 2);
    
    for (let i = 0; i < 3; i++) {
      storageAccount.append('rect')
        .attr('x', 130)
        .attr('y', 785 + i * 14)
        .attr('width', 40)
        .attr('height', 10)
        .attr('fill', '#ffffff')
        .attr('stroke', '#004578')
        .attr('stroke-width', 1);
    }

    storageAccount.append('text')
      .attr('x', 150)
      .attr('y', 850)
      .attr('text-anchor', 'middle')
      .attr('font-size', 18)
      .attr('font-weight', 'bold')
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#0072c6')
      .text('Storage Account');

    storageAccount.append('text')
      .attr('x', 150)
      .attr('y', 867)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#666')
      .text('Combine Artifacts');

    // VNet boundary
    svg.append('rect')
      .attr('x', 450)
      .attr('y', 50)
      .attr('width', 900)
      .attr('height', 800)
      .attr('rx', 10)
      .attr('fill', 'url(#vnetGradient)')
      .attr('stroke', '#0078d4')
      .attr('stroke-width', 4)
      .attr('stroke-dasharray', '15,8');

    svg.append('text')
      .attr('x', 480)
      .attr('y', 90)
      .attr('font-size', 32)
      .attr('font-weight', 'bold')
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#0078d4')
      .text('VNet: Combine (10.3.0.0/16)');

    // Combine-Core Subnet
    const coreSubnet = svg.append('g');
    coreSubnet.append('rect')
      .attr('x', 480)
      .attr('y', 120)
      .attr('width', 420)
      .attr('height', 350)
      .attr('rx', 8)
      .attr('fill', 'url(#subnetGradient)')
      .attr('stroke', '#50e6ff')
      .attr('stroke-width', 3);

    coreSubnet.append('text')
      .attr('x', 500)
      .attr('y', 155)
      .attr('font-size', 20)
      .attr('font-weight', 'bold')
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#0078d4')
      .text('Combine-Core (10.3.0.0/24)');

    // Proxy
    const proxyVM = coreSubnet.append('g')
      .attr('class', 'clickable')
      .style('cursor', 'pointer')
      .on('click', () => setSelectedNode('proxy'));

    proxyVM.append('rect')
      .attr('x', 510)
      .attr('y', 180)
      .attr('width', 160)
      .attr('height', 110)
      .attr('rx', 6)
      .attr('fill', '#ffffff')
      .attr('stroke', '#d83b01')
      .attr('stroke-width', 3);

    // Proxy icon (server with lock)
    proxyVM.append('rect')
      .attr('x', 560)
      .attr('y', 200)
      .attr('width', 60)
      .attr('height', 40)
      .attr('rx', 3)
      .attr('fill', '#d83b01');
    proxyVM.append('rect')
      .attr('x', 575)
      .attr('y', 215)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', '#ffffff');
    proxyVM.append('rect')
      .attr('x', 595)
      .attr('y', 215)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', '#ffffff');

    proxyVM.append('text')
      .attr('x', 590)
      .attr('y', 265)
      .attr('text-anchor', 'middle')
      .attr('font-size', 20)
      .attr('font-weight', 'bold')
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#d83b01')
      .text('Proxy');

    proxyVM.append('text')
      .attr('x', 590)
      .attr('y', 285)
      .attr('text-anchor', 'middle')
      .attr('font-size', 13)
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#666')
      .text('High-Side Airgap Emulator');

    // Endpoints with LB
    const endpointsVMSS = coreSubnet.append('g')
      .attr('class', 'clickable')
      .style('cursor', 'pointer')
      .on('click', () => setSelectedNode('endpoints'));

    endpointsVMSS.append('rect')
      .attr('x', 710)
      .attr('y', 160)
      .attr('width', 160)
      .attr('height', 150)
      .attr('rx', 6)
      .attr('fill', '#ffffff')
      .attr('stroke', '#00a4ef')
      .attr('stroke-width', 3);

    // Load balancer icon at the top
    endpointsVMSS.append('circle')
      .attr('cx', 790)
      .attr('cy', 185)
      .attr('r', 18)
      .attr('fill', '#00a4ef');
    endpointsVMSS.append('line')
      .attr('x1', 775)
      .attr('y1', 185)
      .attr('x2', 805)
      .attr('y2', 185)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3);
    endpointsVMSS.append('line')
      .attr('x1', 790)
      .attr('y1', 170)
      .attr('x2', 790)
      .attr('y2', 200)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3);

    endpointsVMSS.append('text')
      .attr('x', 790)
      .attr('y', 225)
      .attr('text-anchor', 'middle')
      .attr('font-size', 14)
      .attr('font-weight', 'bold')
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#00a4ef')
      .text('Load Balancer');

    endpointsVMSS.append('text')
      .attr('x', 790)
      .attr('y', 243)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#666')
      .text('(Static IP)');

    // VMSS boxes
    for (let i = 0; i < 3; i++) {
      endpointsVMSS.append('rect')
        .attr('x', 730 + i * 25)
        .attr('y', 258)
        .attr('width', 20)
        .attr('height', 25)
        .attr('fill', '#00a4ef')
        .attr('stroke', '#005a9e')
        .attr('stroke-width', 1);
    }

    endpointsVMSS.append('text')
      .attr('x', 790)
      .attr('y', 302)
      .attr('text-anchor', 'middle')
      .attr('font-size', 20)
      .attr('font-weight', 'bold')
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#00a4ef')
      .text('Endpoints');

    // Private DNS Zone
    coreSubnet.append('rect')
      .attr('x', 510)
      .attr('y', 330)
      .attr('width', 360)
      .attr('height', 120)
      .attr('rx', 6)
      .attr('fill', '#faf4ff')
      .attr('stroke', '#8661c5')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,3');

    coreSubnet.append('text')
      .attr('x', 690)
      .attr('y', 365)
      .attr('text-anchor', 'middle')
      .attr('font-size', 18)
      .attr('font-weight', 'bold')
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#8661c5')
      .text('🌐 Private DNS Zone');

    coreSubnet.append('text')
      .attr('x', 690)
      .attr('y', 393)
      .attr('text-anchor', 'middle')
      .attr('font-size', 16)
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#666')
      .text('*.scombine.scloud');

    coreSubnet.append('text')
      .attr('x', 690)
      .attr('y', 415)
      .attr('text-anchor', 'middle')
      .attr('font-size', 14)
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#666')
      .text('→ LB Static IP');

    coreSubnet.append('text')
      .attr('x', 690)
      .attr('y', 437)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#999')
      .text('(microsoft.scloud endpoint rewrite)');

    // Combine-Functions Subnet
    const functionsSubnet = svg.append('g');
    functionsSubnet.append('rect')
      .attr('x', 480)
      .attr('y', 500)
      .attr('width', 420)
      .attr('height', 140)
      .attr('rx', 8)
      .attr('fill', 'url(#subnetGradient)')
      .attr('stroke', '#50e6ff')
      .attr('stroke-width', 3);

    functionsSubnet.append('text')
      .attr('x', 500)
      .attr('y', 535)
      .attr('font-size', 20)
      .attr('font-weight', 'bold')
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#0078d4')
      .text('Combine-Functions (10.3.1.0/24)');

    functionsSubnet.append('text')
      .attr('x', 500)
      .attr('y', 560)
      .attr('font-size', 15)
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#666')
      .text('Delegated to Function App');

    // Function app icon
    functionsSubnet.append('polygon')
      .attr('points', '690,570 710,580 710,610 690,620 670,610 670,580')
      .attr('fill', '#ffca00')
      .attr('stroke', '#e8a600')
      .attr('stroke-width', 2);

    functionsSubnet.append('text')
      .attr('x', 690)
      .attr('y', 600)
      .attr('text-anchor', 'middle')
      .attr('font-size', 18)
      .attr('fill', '#ffffff')
      .text('⚡');

    // Other Subnets (stacked appearance)
    const otherSubnets = svg.append('g');
    
    // Combine-Ingress
    otherSubnets.append('rect')
      .attr('x', 480)
      .attr('y', 670)
      .attr('width', 190)
      .attr('height', 80)
      .attr('rx', 6)
      .attr('fill', 'url(#subnetGradient)')
      .attr('stroke', '#50e6ff')
      .attr('stroke-width', 2);

    otherSubnets.append('text')
      .attr('x', 495)
      .attr('y', 700)
      .attr('font-size', 17)
      .attr('font-weight', 'bold')
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#0078d4')
      .text('Combine-Ingress');

    otherSubnets.append('text')
      .attr('x', 495)
      .attr('y', 723)
      .attr('font-size', 14)
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#666')
      .text('10.3.2.0/25');

    // Combine-Public
    otherSubnets.append('rect')
      .attr('x', 480)
      .attr('y', 765)
      .attr('width', 190)
      .attr('height', 70)
      .attr('rx', 6)
      .attr('fill', 'url(#subnetGradient)')
      .attr('stroke', '#50e6ff')
      .attr('stroke-width', 2);

    otherSubnets.append('text')
      .attr('x', 495)
      .attr('y', 795)
      .attr('font-size', 17)
      .attr('font-weight', 'bold')
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#0078d4')
      .text('Combine-Public');

    otherSubnets.append('text')
      .attr('x', 495)
      .attr('y', 818)
      .attr('font-size', 14)
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#666')
      .text('10.3.2.128/25');

    // Customer Subnets (stacked/overlapped)
    const customerSubnets = [
      { name: 'Customer-A', cidr: '10.3.101.0/24', offset: 0 },
      { name: 'Customer-B', cidr: '10.3.102.0/24', offset: 8 },
      { name: 'Customer-C', cidr: '10.3.103.0/24', offset: 16 },
      { name: 'Customer-D', cidr: '10.3.104.0/24', offset: 24 }
    ];

    const customerGroup = svg.append('g');
    
    customerSubnets.forEach((subnet, i) => {
      const baseX = 950;
      const baseY = 120;
      
      customerGroup.append('rect')
        .attr('x', baseX + subnet.offset)
        .attr('y', baseY + subnet.offset)
        .attr('width', 350)
        .attr('height', 250)
        .attr('rx', 8)
        .attr('fill', i === 3 ? 'url(#subnetGradient)' : '#f0f8ff')
        .attr('stroke', '#50e6ff')
        .attr('stroke-width', 3)
        .attr('opacity', i === 3 ? 1 : 0.7);

      if (i === 3) {
        customerGroup.append('text')
          .attr('x', baseX + subnet.offset + 20)
          .attr('y', baseY + subnet.offset + 38)
          .attr('font-size', 20)
          .attr('font-weight', 'bold')
          .attr('font-family', 'Helvetica, Arial, sans-serif')
          .attr('fill', '#0078d4')
          .text('Customer Subnets');

        customerGroup.append('text')
          .attr('x', baseX + subnet.offset + 20)
          .attr('y', baseY + subnet.offset + 63)
          .attr('font-size', 15)
          .attr('font-family', 'Helvetica, Arial, sans-serif')
          .attr('fill', '#666')
          .text('Combine-Customer-A through D');

        customerGroup.append('text')
          .attr('x', baseX + subnet.offset + 20)
          .attr('y', baseY + subnet.offset + 85)
          .attr('font-size', 14)
          .attr('font-family', 'Helvetica, Arial, sans-serif')
          .attr('fill', '#666')
          .text('10.3.101-104.0/24');

        // Workload boxes
        for (let j = 0; j < 3; j++) {
          customerGroup.append('rect')
            .attr('x', baseX + subnet.offset + 80 + j * 70)
            .attr('y', baseY + subnet.offset + 120)
            .attr('width', 55)
            .attr('height', 70)
            .attr('rx', 4)
            .attr('fill', '#ffffff')
            .attr('stroke', '#0078d4')
            .attr('stroke-width', 2);

          customerGroup.append('text')
            .attr('x', baseX + subnet.offset + 107.5 + j * 70)
            .attr('y', baseY + subnet.offset + 160)
            .attr('text-anchor', 'middle')
            .attr('font-size', 24)
            .text('📦');
        }

        customerGroup.append('text')
          .attr('x', baseX + subnet.offset + 175)
          .attr('y', baseY + subnet.offset + 230)
          .attr('text-anchor', 'middle')
          .attr('font-size', 15)
          .attr('font-family', 'Helvetica, Arial, sans-serif')
          .attr('fill', '#666')
          .text('Customer Workloads');
      }
    });

    // Route Table
    svg.append('rect')
      .attr('x', 950)
      .attr('y', 450)
      .attr('width', 360)
      .attr('height', 100)
      .attr('rx', 8)
      .attr('fill', '#fff9e6')
      .attr('stroke', '#ffb900')
      .attr('stroke-width', 3);

    svg.append('text')
      .attr('x', 1130)
      .attr('y', 485)
      .attr('text-anchor', 'middle')
      .attr('font-size', 19)
      .attr('font-weight', 'bold')
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#ffb900')
      .text('🗺️ Route Table: Combine-Private');

    svg.append('text')
      .attr('x', 1130)
      .attr('y', 513)
      .attr('text-anchor', 'middle')
      .attr('font-size', 15)
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#666')
      .text('Applied to all Customer Subnets');

    svg.append('text')
      .attr('x', 1130)
      .attr('y', 540)
      .attr('text-anchor', 'middle')
      .attr('font-size', 16)
      .attr('font-weight', 'bold')
      .attr('font-family', 'Helvetica, Arial, sans-serif')
      .attr('fill', '#d83b01')
      .text('0.0.0.0/0 → Proxy');

    // Draw arrows with better routing
    const drawCurvedArrow = (x1, y1, x2, y2, color, label, controlOffsetX = 0, controlOffsetY = 0) => {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      
      const path = svg.append('path')
        .attr('d', `M ${x1} ${y1} Q ${midX + controlOffsetX} ${midY + controlOffsetY} ${x2} ${y2}`)
        .attr('stroke', `#${color}`)
        .attr('stroke-width', 3)
        .attr('fill', 'none')
        .attr('marker-end', `url(#arrowhead-${color})`);

      if (label) {
        svg.append('text')
          .attr('x', midX + controlOffsetX / 2)
          .attr('y', midY + controlOffsetY / 2 - 10)
          .attr('text-anchor', 'middle')
          .attr('font-size', 15)
          .attr('font-weight', 'bold')
          .attr('font-family', 'Helvetica, Arial, sans-serif')
          .attr('fill', `#${color}`)
          .text(label);
      }
    };

    // Bastion to VNet
    drawCurvedArrow(240, 180, 450, 300, '0078d4', 'Access', 0, 50);

    // Proxy to Internet (outside public zone)
    drawCurvedArrow(510, 235, 280, 340, 'd83b01', 'Filtered', -80, 0);

    // Customer to Load Balancer (Azure API) - direct to LB at top
    drawCurvedArrow(950, 220, 790, 185, '00a4ef', 'Azure API', -40, -20);

    // Customer to Proxy (via route table)
    drawCurvedArrow(1050, 370, 670, 270, 'd83b01', 'Internet', 100, 0);


  }, []);

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">Combine Architecture</h1>
            <p className="text-lg text-gray-600">High-Side Cloud Account Emulator on Azure Commercial</p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">🎯 System Overview</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-blue-800 mb-1">Network Flow:</p>
                <ul className="space-y-1 ml-4">
                  <li><span className="text-red-600 font-bold">●</span> Internet → Proxy (airgap enforcement)</li>
                  <li><span className="text-blue-600 font-bold">●</span> Azure API → Endpoints (MITM rewrite)</li>
                  <li><span className="text-green-600 font-bold">●</span> Violations → Cosmos DB</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-blue-800 mb-1">Key Components:</p>
                <ul className="space-y-1 ml-4">
                  <li>Proxy: High-side airgap emulator</li>
                  <li>Endpoints: Azure API rewriter (*.scombine.scloud)</li>
                  <li>Customer Subnets: Isolated workload zones</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <svg ref={svgRef} className="w-full"></svg>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 text-lg">Network Subnets</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex justify-between"><span>Combine-Core:</span> <code className="bg-white px-2 py-1 rounded">10.3.0.0/24</code></li>
                <li className="flex justify-between"><span>Combine-Functions:</span> <code className="bg-white px-2 py-1 rounded">10.3.1.0/24</code></li>
                <li className="flex justify-between"><span>Customer A-D:</span> <code className="bg-white px-2 py-1 rounded">10.3.101-104.0/24</code></li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-3 text-lg">Traffic Flow</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><span className="text-blue-600 font-bold">→</span> Azure API via Endpoints VMSS</li>
                <li><span className="text-red-600 font-bold">→</span> Internet via Proxy VM</li>
                <li><span className="text-green-600 font-bold">→</span> Violations to Cosmos DB</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-3 text-lg">Key Features</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ High-side airgap emulation</li>
                <li>✓ Azure API endpoint rewriting</li>
                <li>✓ Violation tracking & monitoring</li>
                <li>✓ Customer workload isolation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};